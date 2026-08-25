/* ==========================================================================
   PSD Esports — CSV loader and date helpers.

   Every page calls PSD.fetchCSV(sheetId, gid) instead of building Google
   URLs itself. It returns the same CSV text the pages have always parsed,
   so no page parsing logic changed — this just removes the copy-pasted
   URL building and gives every page the same timeout behaviour.

   Sheet ids and gids come from data/leagues.js. Load that first.
   ========================================================================== */

(function (root) {
  'use strict';

  var CONFIG = root.PSD_CONFIG;
  if (!CONFIG) throw new Error('psd-data.js: load data/leagues.js first.');

  var TIMEOUT_MS = 8000;

  /* ---- dates -------------------------------------------------------------

     'YYYY-MM-DD' -> Date at LOCAL midnight.

     new Date('2026-03-02') parses as UTC midnight, which is the evening of
     Mar 1 in Arizona. That shifted every week boundary a day early, so the
     schedule page could jump to the next week before it started.
     ------------------------------------------------------------------------ */

  function localDate(iso) {
    // Dates that are not set yet (finals day is TBA until announced) come
    // through as null. Return null rather than an Invalid Date so callers can
    // test for "not scheduled" instead of guarding every arithmetic result.
    if (!iso) return null;
    var p = String(iso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  /** 'YYYY-MM-DD' + 'HH:MM:SS' -> Date at that LOCAL wall-clock time. */
  function localDateTime(iso, time) {
    var d = localDate(iso);
    if (!d) return null;
    var t = String(time || '00:00:00').split(':');
    d.setHours(+t[0] || 0, +t[1] || 0, +t[2] || 0, 0);
    return d;
  }

  /** [{ week, date }] at local midnight, for "which week are we in" logic. */
  function weekDates(leagueId) {
    return CONFIG.league(leagueId).weeks.map(function (w) {
      return { week: w.week, date: localDate(w.startDate) };
    });
  }

  /* ---- season-wide moments ------------------------------------------------

     The two divisions no longer share a kickoff: Late Release plays Mondays at
     4:00 PM and Early Release Tuesdays at 2:00 PM. "The season starts" means
     the first match of whichever division goes first, so these walk every
     league rather than reading one season-wide field.
     ------------------------------------------------------------------------ */

  /** First match of week 1, across all divisions. Null if no weeks are set. */
  function seasonStart() {
    var earliest = null;
    CONFIG.leagues.forEach(function (lg) {
      var w1 = lg.weeks[0];
      if (!w1) return;
      var d = localDateTime(w1.startDate, lg.matchTime);
      if (d && (!earliest || d < earliest)) earliest = d;
    });
    return earliest;
  }

  /** Last match day of the regular season, across all divisions. */
  function seasonEnd() {
    var latest = null;
    CONFIG.leagues.forEach(function (lg) {
      var last = lg.weeks[lg.weeks.length - 1];
      if (!last) return;
      var d = localDateTime(last.startDate, lg.matchTime);
      if (d && (!latest || d > latest)) latest = d;
    });
    return latest;
  }

  /** Championship tip-off, or null while the date is still TBA. */
  function finalsStart() {
    return localDateTime(CONFIG.finalsDate, CONFIG.finalsTipoff);
  }

  /**
   * Where the season is right now: 'preseason' | 'live' | 'finals-day' |
   * 'postseason'. The homepage swaps its hero on this.
   *
   * With finals TBA, there is no known end point, so the season stays 'live'
   * after the last regular-season match instead of guessing an off-season
   * date. Filling in finalsDate turns the finals states back on by itself.
   */
  function seasonPhase(now) {
    now = now || new Date();
    var start  = seasonStart();
    var finals = finalsStart();

    if (start && now < start) return 'preseason';

    if (finals) {
      var finalsDay = localDate(CONFIG.finalsDate);
      var dayAfter  = new Date(finalsDay.getTime() + 86400000);
      if (now >= dayAfter) return 'postseason';
      if (now >= finalsDay) return 'finals-day';
    }

    var end = localDate(CONFIG.seasonEndDate);
    if (end && now >= end) return 'postseason';

    return 'live';
  }

  /** Week number a division is on right now (1-based, clamped to the season). */
  function currentWeek(leagueId) {
    var now = new Date();
    var wks = weekDates(leagueId);
    var wk = 1;
    for (var i = 0; i < wks.length; i++) {
      if (now >= wks[i].date) wk = wks[i].week;
    }
    return wk;
  }

  /* ---- fetching ---------------------------------------------------------- */

  function liveUrl(sheetId, gid) {
    return 'https://docs.google.com/spreadsheets/d/e/' + sheetId +
           '/pub?output=csv&gid=' + gid;
  }

  /** One published tab, as CSV text. Rejects on network error or timeout. */
  function fetchCSV(sheetId, gid) {
    // Between seasons the workbook does not exist yet and every id in
    // leagues.js is null. Building a URL out of those nulls asks Google for
    // ".../d/e/null/pub?gid=null", which 404s once per tab and fills the
    // console with noise. Fail immediately instead, without a request.
    if (!sheetId || gid === null || gid === undefined || gid === '') {
      return Promise.reject(new Error('No sheet published yet for gid ' + gid));
    }

    // AbortController so a hanging request can't leave the page spinning
    // forever on slow school wifi.
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);

    var init = { cache: 'no-store' };
    if (ctrl) init.signal = ctrl.signal;

    return fetch(liveUrl(sheetId, gid), init).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('gid ' + gid + ' -> HTTP ' + res.status);
      return res.text();
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  /**
   * Many tabs at once, resolved in the order given.
   *
   * A tab that fails resolves to '' rather than rejecting the whole batch, so
   * one unpublished or slow tab degrades to a missing week instead of an empty
   * page. Callers already treat '' as "no rows". Use fetchCSV directly when a
   * single tab failing genuinely is an error worth surfacing.
   */
  function fetchAllCSV(sheetId, gids) {
    // An unpublished season is an expected state, not a failure, so it does
    // not get a warning per tab — only genuine fetch problems do.
    var published = !!sheetId;
    return Promise.all(gids.map(function (gid) {
      return fetchCSV(sheetId, gid).catch(function (err) {
        if (published && root.console && console.warn) {
          console.warn('[PSD] gid ' + gid + ' failed, skipping:', err.message);
        }
        return '';
      });
    }));
  }

  root.PSD = {
    config:        CONFIG,
    fetchCSV:      fetchCSV,
    fetchAllCSV:   fetchAllCSV,
    liveUrl:       liveUrl,
    weekDates:     weekDates,
    localDate:     localDate,
    localDateTime: localDateTime,
    seasonStart:   seasonStart,
    seasonEnd:     seasonEnd,
    finalsStart:   finalsStart,
    seasonPhase:   seasonPhase,
    currentWeek:   currentWeek
  };

})(window);
