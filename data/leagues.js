/* ==========================================================================
   PSD Esports — single source of truth for all Google Sheets wiring.

   THIS IS THE ONLY FILE YOU EDIT AT THE START OF A NEW SEASON.

   How to roll over to a new season:
     1. Bump SEASON below.
     2. For each league, paste the new week gids and start dates.
        (Get a gid by opening the tab in Sheets — it is the number at the
        end of the URL, after "#gid=".)
     3. If a workbook was re-published, paste the new publish id into
        `matchSheet` / `statsSheet`. That is the long "2PACX-..." string in
        File > Share > Publish to web.
     4. Commit. Every page picks the change up automatically.

   Every page reads this one file, so the homepage, standings, schedules,
   stats and finals can never disagree about which tabs the season uses.

   ---- 2026-2027 NOTES -----------------------------------------------------

   The league is now split by RELEASE TIME, not grade level. `name` is what
   the rulebook calls a division — "Promise: Early Release" — and `shortName`
   is what tables and nav use, since two columns both starting "Promise"
   would be unreadable.

   The ids `pl` and `jrpl` are deliberately UNCHANGED so that every existing
   page, bookmark and psdesports.com link keeps working:
       pl   -> Late Release  (was "Promise League",    Mondays)
       jrpl -> Early Release (was "Jr Promise League",  Tuesdays)
   The school lists carried over cleanly under that mapping — Late Release is
   a subset of the old Promise League, and Early Release is the old Jr Promise
   League plus Mesquite. Renaming the ids would break links and gain nothing.

   Match workbooks are published for both divisions. The STATS workbooks are
   not, so `statsSheet` and every `statsGid` are still null — pages call
   PSD.config.hasLiveStats(id) and show a "coming soon" state rather than
   firing doomed requests at Google. Same for the finals date, which the
   2026-2027 rulebook lists as TBA.
   ========================================================================== */

(function (root) {
  'use strict';

  var SEASON = '2026-2027-fall';

  var CONFIG = {
    season: SEASON,
    seasonLabel: '2026-27 Fall Season',

    // Season-wide dates. Local time, not UTC.
    // Finals day is TBA in the 2026-2027 rulebook. Leave these null until the
    // date is announced — the homepage renders a "dates TBA" card instead of a
    // countdown, and flips to a countdown the moment a date is filled in.
    finalsDate:    null,          // 'YYYY-MM-DD' finals tournament day
    finalsTipoff:  '09:00:00',    // first match of finals day
    seasonEndDate: null,          // site flips to off-season after this

    leagues: [
      {
        id: 'pl',
        name: 'Promise: Late Release',
        shortName: 'Late Release',
        blurb: 'Late Release · Mondays',

        // When this division plays. Each division now has its own day and
        // time, so this can no longer be one season-wide kickoff value.
        matchDay:      'Monday',
        matchTime:     '16:00:00',   // 4:00 PM
        matchTimeLabel: '4:00 PM',
        forfeitTimeLabel: '4:15 PM', // check-in deadline, rulebook 4.4.3

        schools: ['Cactus', 'David G Millen', 'Sage', 'Shadow Hills'],

        // "DGM" is deliberately absent: the sheet uses it everywhere, it is
        // what the logo and colour maps already key on, and it fits the
        // standings table better than the full name. It is a nickname, not a
        // misspelling, so it is left to stand as written.
        aliases: {},

        // Workbook holding week-by-week match results.
        matchSheet: '2PACX-1vQTuL_DK8CmYc8Nz_FGKw-sdFey0xiTz9IvCatndVjoJCuq74boYj22aULYdC6sQ1QS_8-cTpIZTH73',
        // Separate workbook holding per-player stats. Different tabs, different gids.
        statsSheet: null,

        // Finals bracket lives on its own tab in the match workbook.
        // Formatting on this tab is expected to change for 2026-27.
        finalsGid: '672839496',
        finalsTimes: { s1: '12:00 PM', s2: '12:45 PM', fin: '1:30 PM' },

        // 4 schools, 9 weeks: every pair meets 3 times, 2 series per week.
        weeks: [
          { week: 1, gid: '0',          statsGid: null, startDate: '2026-09-21' },
          { week: 2, gid: '1394279234', statsGid: null, startDate: '2026-09-28' },
          { week: 3, gid: '1802241807', statsGid: null, startDate: '2026-10-05' },
          { week: 4, gid: '865555826',  statsGid: null, startDate: '2026-10-12' },
          { week: 5, gid: '510645723',  statsGid: null, startDate: '2026-10-19' },
          { week: 6, gid: '670646977',  statsGid: null, startDate: '2026-10-26' },
          { week: 7, gid: '1597369451', statsGid: null, startDate: '2026-11-02' },
          { week: 8, gid: '1779418916', statsGid: null, startDate: '2026-11-09' },
          { week: 9, gid: '1661876514', statsGid: null, startDate: '2026-11-16' }
        ]
      },

      {
        id: 'jrpl',
        name: 'Promise: Early Release',
        shortName: 'Early Release',
        blurb: 'Early Release · Tuesdays',

        matchDay:      'Tuesday',
        matchTime:     '14:00:00',   // 2:00 PM
        matchTimeLabel: '2:00 PM',
        forfeitTimeLabel: '2:15 PM',

        schools: ['Cimarron', 'Desert Rose', 'Innovations Academy', 'Los Amigos',
                  'Manzanita', 'Mesquite', 'Palmtree', 'Tumbleweed', 'Yucca'],

        // Misspellings that appear in the sheet, mapped to the roster name.
        // Spacing and case do not need an entry — canonicalSchool() already
        // ignores those, so "Palm Tree" finds "Palmtree" on its own. Only
        // genuinely different letters belong here.
        aliases: { 'Cimmaron': 'Cimarron', 'Cimmarron': 'Cimarron' },

        matchSheet: '2PACX-1vQuwh0wsNcmLfZR0otmToNWeUwN7Rv5wsuGb69HBhaNdBctXvOkFgduDfwe3rzOrFucSEjHFMvVwrE2',
        statsSheet: null,

        // Formatting on this tab is expected to change for 2026-27.
        finalsGid: '2049340971',
        finalsTimes: { s1: '9:30 AM', s2: '10:15 AM', fin: '11:00 AM' },

        // 9 schools, 9 weeks: full single round robin, one bye per week. The
        // bye school is the last row on each tab, with BYE in every column.
        weeks: [
          { week: 1, gid: '0',          statsGid: null, startDate: '2026-09-22' },
          { week: 2, gid: '426994172',  statsGid: null, startDate: '2026-09-29' },
          { week: 3, gid: '1433543241', statsGid: null, startDate: '2026-10-06' },
          { week: 4, gid: '444737932',  statsGid: null, startDate: '2026-10-13' },
          { week: 5, gid: '1415786975', statsGid: null, startDate: '2026-10-20' },
          { week: 6, gid: '1494494803', statsGid: null, startDate: '2026-10-27' },
          { week: 7, gid: '1784129739', statsGid: null, startDate: '2026-11-03' },
          { week: 8, gid: '245869125',  statsGid: null, startDate: '2026-11-10' },
          { week: 9, gid: '1127902206', statsGid: null, startDate: '2026-11-17' }
        ]
      }
    ]
  };

  /* ---- school badges ------------------------------------------------------

     Logos are hot-linked from Edlio (3.files.edl.io), the CMS behind the
     district's school sites. The paths are opaque uploads — bucket hash,
     upload date, UUID — so a new school's URL has to be copied from its page
     rather than derived.

     This used to be copy-pasted into eight files, which is why adding one
     school meant eight edits and why three schools that left the league were
     still listed months later. Every page now reads this one object.

     `also` lists other spellings that should resolve to the same badge —
     nicknames the sheets use, or misspellings seen in the wild. Case, spaces
     and punctuation are already ignored, so "Palm Tree" needs no entry.
     ------------------------------------------------------------------------ */

  var SCHOOLS = {
    /* ---- Late Release ---- */
    'Cactus':              { color: '#2e7d32', logo: 'https://3.files.edl.io/63ab/24/01/30/203120-a87c60bc-37da-483c-b392-238488c963de.png' },
    'David G Millen':      { color: '#1565c0', logo: 'https://3.files.edl.io/8dc4/24/01/30/203122-5a3b347a-0d9f-434d-afcb-d500e246f4e3.png', also: ['DGM'] },
    'Sage':                { color: '#00695c', logo: 'https://3.files.edl.io/e005/24/01/30/203135-3f3e9191-5b83-4ba9-a47c-124e5d54428c.png' },
    'Shadow Hills':        { color: '#c62828', logo: 'https://3.files.edl.io/88eb/24/01/30/203136-53ac6114-93b7-46a0-8fae-f78daf6287de.png' },

    /* ---- Early Release ---- */
    'Cimarron':            { color: '#b45309', logo: 'https://3.files.edl.io/bfd5/24/01/30/203122-a5d549fc-84c8-4af4-9e2a-4ca56e0f02ee.png', also: ['Cimmaron', 'Cimmarron'] },
    'Desert Rose':         { color: '#be185d', logo: 'https://3.files.edl.io/bbc0/24/01/30/203123-f1eb745a-e767-4d91-80a4-2923ab07654d.png' },
    'Innovations Academy': { color: '#0369a1', logo: 'https://3.files.edl.io/5b29/24/01/30/203127-760b8684-7411-463d-84d0-38653baa5249.png', also: ['Innovations'] },
    'Los Amigos':          { color: '#15803d', logo: 'https://3.files.edl.io/aa2d/24/01/30/203128-f79f02e7-682b-4e43-975d-d6ac2b210779.png' },
    'Manzanita':           { color: '#7c2d12', logo: 'https://3.files.edl.io/78d0/24/11/12/173918-dbf6ddaa-bf7b-408d-aa49-db4cdecdc9bb.png' },
    // New for 2026-27. Edlio serves this one as a .jpg, unlike the rest.
    'Mesquite':            { color: '#5b21b6', logo: 'https://3.files.edl.io/6737/24/01/08/225238-a58895d9-74ec-4463-9225-f720109953c4.jpg' },
    'Palmtree':            { color: '#047857', logo: 'https://3.files.edl.io/deef/24/01/30/203132-727d82ee-15ae-4e4a-9e3b-95f7e677e038.png' },
    'Tumbleweed':          { color: '#92400e', logo: 'https://3.files.edl.io/419d/25/10/02/220537-89da6677-8013-4232-bf2b-62aab2b64d29.png' },
    'Yucca':               { color: '#4d7c0f', logo: 'https://3.files.edl.io/c0fd/24/01/30/203144-7cccf38b-4ea6-4ca5-ac4e-1c5cb2ecdc53.png' }
  };

  CONFIG.schools_registry = SCHOOLS;

  /* ---- convenience lookups (used by the pages) ---------------------------- */

  CONFIG.league = function (id) {
    for (var i = 0; i < CONFIG.leagues.length; i++) {
      if (CONFIG.leagues[i].id === id) return CONFIG.leagues[i];
    }
    throw new Error('Unknown league id: ' + id);
  };

  CONFIG.matchGids = function (id) {
    return CONFIG.league(id).weeks.map(function (w) { return w.gid; });
  };

  CONFIG.statsGids = function (id) {
    return CONFIG.league(id).weeks.map(function (w) { return w.statsGid; });
  };

  /**
   * Is this league's MATCH workbook published yet?
   *
   * Between seasons the sheets do not exist, and firing requests at Google for
   * a null id just fills the console with 404s and makes pages sit on a
   * spinner. Pages check this first and render a "coming soon" state instead.
   *
   * The two workbooks go live independently — results are usually published
   * before per-player stats — so standings/schedule ask this and the stats
   * pages ask hasLiveStats() below. Answering both from one flag would make
   * the stats page spin against a statsSheet that is still null.
   */
  CONFIG.hasLiveData = function (id) {
    var lg = CONFIG.league(id);
    if (!lg.matchSheet) return false;
    return lg.weeks.some(function (w) { return w.gid !== null && w.gid !== undefined; });
  };

  /**
   * A school name as typed in the sheet -> the roster spelling.
   *
   * Coaches and admins retype these every week, and the same school has
   * already arrived as "Sage"/"SAGE", "Palmtree"/"Palm Tree" and
   * "Cimarron"/"Cimmaron". Records are keyed off this string, so each variant
   * would otherwise become its own row in the standings and its own player in
   * the stats — and miss its logo, since the logo maps key on the roster name.
   *
   * Case, spacing and punctuation are ignored when matching, so only genuine
   * misspellings need an entry in the league's `aliases`. An unrecognised
   * name is passed through unchanged rather than guessed at, so a school
   * added mid-season still shows up instead of vanishing.
   */
  function reduce(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  CONFIG.canonicalSchool = function (id, raw) {
    var name = String(raw || '').trim().replace(/\s+/g, ' ');
    if (!name) return '';

    var lg  = CONFIG.league(id);
    var key = reduce(name);

    for (var i = 0; i < (lg.schools || []).length; i++) {
      if (reduce(lg.schools[i]) === key) return lg.schools[i];
    }

    var aliases = lg.aliases || {};
    for (var written in aliases) {
      if (Object.prototype.hasOwnProperty.call(aliases, written) &&
          reduce(written) === key) return aliases[written];
    }

    return name;
  };

  /**
   * The registry entry for a school, by any spelling it is written with.
   *
   * Matching ignores case, spacing and punctuation, and also checks the
   * `also` list, so "DGM", "Palm Tree" and "CIMMARON" all resolve. Returns
   * null for an unknown name — callers fall back to initials.
   */
  function schoolEntry(name) {
    var key = reduce(name);
    if (!key) return null;

    for (var canonical in SCHOOLS) {
      if (!Object.prototype.hasOwnProperty.call(SCHOOLS, canonical)) continue;
      if (reduce(canonical) === key) return SCHOOLS[canonical];

      var also = SCHOOLS[canonical].also || [];
      for (var i = 0; i < also.length; i++) {
        if (reduce(also[i]) === key) return SCHOOLS[canonical];
      }
    }
    return null;
  }

  /** Logo URL for a school, or null when none is on file. */
  CONFIG.schoolLogo = function (name) {
    var e = schoolEntry(name);
    return e ? (e.logo || null) : null;
  };

  /** Brand colour for a school, or null when it is not a known school. */
  CONFIG.schoolColor = function (name) {
    var e = schoolEntry(name);
    return e ? (e.color || null) : null;
  };

  /** Is this league's STATS workbook published yet? */
  CONFIG.hasLiveStats = function (id) {
    var lg = CONFIG.league(id);
    if (!lg.statsSheet) return false;
    return lg.weeks.some(function (w) { return w.statsGid !== null && w.statsGid !== undefined; });
  };

  /** True when no division has published results yet. */
  CONFIG.isPreSeason = function () {
    return !CONFIG.leagues.some(function (lg) { return CONFIG.hasLiveData(lg.id); });
  };

  root.PSD_CONFIG = CONFIG;

})(window);
