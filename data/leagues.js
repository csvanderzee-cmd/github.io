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
   ========================================================================== */

(function (root) {
  'use strict';

  var SEASON = '2026-spring';

  var CONFIG = {
    season: SEASON,

    // Season-wide dates. Local time, not UTC.
    kickoffTime:   '16:00:00',    // time on week 1 the homepage counts down to
    finalsDate:    '2026-05-09',  // finals tournament day
    finalsTipoff:  '09:00:00',    // first match of finals day
    seasonEndDate: '2026-05-10',  // site flips to off-season after this

    leagues: [
      {
        id: 'pl',
        name: 'Promise League',
        shortName: 'PL',

        // Workbook holding week-by-week match results.
        matchSheet: '2PACX-1vRfiiH7TZmsMoydz3A4aKuhmT-7X007DLoC_IFjU-3kxNbK-abiagp1KiJc6hNxvbJzvpxT2gmZdn9U',
        // Separate workbook holding per-player stats. Different tabs, different gids.
        statsSheet: '2PACX-1vS5OS88u-Hm0Iu4bkYdZFC4VqtEqsbhGKG9kisztNmNpZOZQo0fP99YUMLF9NW10s5iE2LqrLFxiWef',

        // Finals bracket lives on its own tab in the match workbook.
        finalsGid: '672839496',
        finalsTimes: { s1: '12:00 PM', s2: '12:45 PM', fin: '1:30 PM' },

        weeks: [
          { week: 1, gid: '0',          statsGid: '0',          startDate: '2026-03-02' },
          { week: 2, gid: '1394279234', statsGid: '1412579101', startDate: '2026-03-09' },
          { week: 3, gid: '1802241807', statsGid: '2065270998', startDate: '2026-03-16' },
          { week: 4, gid: '865555826',  statsGid: '1251214549', startDate: '2026-03-30' },
          { week: 5, gid: '510645723',  statsGid: '429105593',  startDate: '2026-04-13' },
          { week: 6, gid: '670646977',  statsGid: '1536200663', startDate: '2026-04-20', interPool: true },
          { week: 7, gid: '1597369451', statsGid: '1586544350', startDate: '2026-04-27' }
        ]
      },

      {
        id: 'jrpl',
        name: 'Jr Promise League',
        shortName: 'JRPL',

        matchSheet: '2PACX-1vRTXXJZey-hpvZVSmyq7J4Mwp1JTKJGdri0PIBXCqNhl5rpDqvsNuX-VYLHh7xoEqZg3uFvk0yaECTO',
        statsSheet: '2PACX-1vTrT4vgQwfWvwkG_e3KcAmmEd9nUmnqVvQ2oxzSEM79g-PWlguAD4UWmqZBy2aiT9W4d7WwSkSqp3fV',

        finalsGid: '2049340971',
        finalsTimes: { s1: '9:30 AM', s2: '10:15 AM', fin: '11:00 AM' },

        weeks: [
          { week: 1, gid: '0',          statsGid: '0',          startDate: '2026-03-03' },
          { week: 2, gid: '426994172',  statsGid: '1261668260', startDate: '2026-03-10' },
          { week: 3, gid: '1433543241', statsGid: '1158082507', startDate: '2026-03-17' },
          { week: 4, gid: '444737932',  statsGid: '374664413',  startDate: '2026-03-31' },
          { week: 5, gid: '1415786975', statsGid: '1141111679', startDate: '2026-04-14' },
          { week: 6, gid: '1494494803', statsGid: '15645180',   startDate: '2026-04-21' },
          { week: 7, gid: '1784129739', statsGid: '1065229934', startDate: '2026-04-28' }
        ]
      }
    ]
  };

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

  root.PSD_CONFIG = CONFIG;

})(window);
