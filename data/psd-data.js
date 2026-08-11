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
    var p = String(iso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  /** 'YYYY-MM-DD' + 'HH:MM:SS' -> Date at that LOCAL wall-clock time. */
  function localDateTime(iso, time) {
    var d = localDate(iso);
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

  /* ---- fetching ---------------------------------------------------------- */

  function liveUrl(sheetId, gid) {
    return 'https://docs.google.com/spreadsheets/d/e/' + sheetId +
           '/pub?output=csv&gid=' + gid;
  }

  /** One published tab, as CSV text. Rejects on network error or timeout. */
  function fetchCSV(sheetId, gid) {
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

  /** Many tabs at once, resolved in the order given. */
  function fetchAllCSV(sheetId, gids) {
    return Promise.all(gids.map(function (gid) { return fetchCSV(sheetId, gid); }));
  }

  root.PSD = {
    config:        CONFIG,
    fetchCSV:      fetchCSV,
    fetchAllCSV:   fetchAllCSV,
    liveUrl:       liveUrl,
    weekDates:     weekDates,
    localDate:     localDate,
    localDateTime: localDateTime
  };

})(window);
