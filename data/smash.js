/* ==========================================================================
   PSD Esports — Smash tournament wiring.

   THIS IS THE ONLY FILE YOU EDIT TO POINT THE BRACKET AT A SHEET.

   The tournament is a one-day event with its own workbook, so it is kept
   separate from data/leagues.js, which carries the season-long Rocket League
   config. Nothing here depends on that file.

   ---- Setting it up -------------------------------------------------------

   1. Share the workbook: Share > General access > "Anyone with the link",
      set to VIEWER. Paste the id out of the normal sheet URL into `sheetId`:
        docs.google.com/spreadsheets/d/<THIS BIT>/edit

   2. One TAB per division. Put each tab's gid — the number after "#gid="
      when that tab is open — against the right division below.

   The page only ever READS. Nothing a visitor does can write back, and the
   sheet is the single source of truth for what is on screen.

   ---- How the tab is read -------------------------------------------------

   Nothing here depends on a fixed row or column number, because they move
   the moment a group has three teams instead of four. Everything is found by
   looking for landmarks:

     * "Round Robin Matches" and "Elimination Matches" mark the two sections.
     * Inside each, a header row carries R1 / R2 / R3 markers. Every "R1"
       marks a BAND: the team names sit one column to its left and that
       game's stock in the three columns from R1 rightwards.
     * Under a round-robin header, team names run down the band's name
       column. Consecutive pairs are one match.
     * Under an elimination label ("Quarter Final 1"), the first two names in
       that band's column are the two teams.

   So four groups or ten, groups of three or four, a bracket that starts at
   the quarter finals or the semis — all read without an edit here.

   One thing to know about the feed: the gviz endpoint DROPS rows that are
   entirely empty, so the spacer rows that make the sheet readable never
   arrive and the row numbers here do not match the ones in Sheets. That is
   exactly why nothing below counts rows.
   ========================================================================== */

(function (root) {
  'use strict';

  var CONFIG = {

    /* ---- event ---------------------------------------------------------- */

    eventName: 'Super Smash Bros. Tournament',
    eventDate: null,       /* 'YYYY-MM-DD' once set; null hides the date chip */
    venue: null,

    /* ---- workbook ------------------------------------------------------- */

    sheetId: '1xC5xlOsaStroHSUwHMzjBflQY2xsCvYCjvYVxLLfrKc',

    /* ---- format --------------------------------------------------------- */

    advance: 2,            /* teams out of each group */
    maxStock: 6,           /* 2 players x 3 stock */
    refreshSeconds: 30,

    /* ---- rules -----------------------------------------------------------

       The rules bubble on both bracket pages is built from this. It lives here
       rather than in the two pages so there is one copy to change, and it is
       stamped with a version so a referee can tell at a glance whether the
       sheet in their hand matches the one on screen.

       WHEN THE RULES CHANGE: edit smash/PSD-Smash-Tournament-Rules.docx, edit
       the summary below to match, and bump `version` and `updated`. The .docx
       is the authoritative document; this is the quick reference beside the
       bracket, and the two disagreeing is worse than either being wrong.
       ---------------------------------------------------------------------- */

    rules: {
      version: '1.0',
      updated: '2 September 2026',
      doc: 'PSD-Smash-Tournament-Rules.docx',

      /* VERBATIM from smash/PSD-Smash-Tournament-Rules.docx. Do not paraphrase
         when editing: the page, the bubble and the printed handout are meant to
         be the same words, so a referee reading the screen and a coach reading
         the paper never find themselves quoting different rules at each other.
         Change the document, then copy the wording across. */
      sections: [
        { title: 'Divisions & Teams', items: [
          'Two divisions: Grade 5 & under, and Grades 6–8. Teams play only within their division.',
          'Schools may enter multiple teams, distinguished by a color (e.g., Shadow Hills Red, Shadow Hills Gold).',
          'Team format: 2v2 doubles — each team is two players, plus an optional alternate. An alternate is locked to that team and may not play for any other team.'
        ]},
        { title: 'Match Format', items: [
          'Best of 3 games. First team to win 2 games wins the match — win-by-games only; total stock does not decide a match.',
          '2v2, 3 stock, 6-minute timer, team damage ON.',
          'Players may switch characters between games in a series.',
          'Coaching between games is allowed; no coaching during a game.'
        ]},
        { title: 'Game Settings', items: [
          'Stage: random, Battlefield only. Stage hazards OFF.',
          "Items: OFF.  Pausing: OFF.  Team stock sharing: ON — a defeated player may take a teammate's spare stock by pressing A+B on elimination (only if the teammate has one to give).",
          'Characters: all non-DLC (base roster) characters. Mii Fighters are banned.',
          'Equipment: docked Switch to Promethean board. Players may use any provided Joy-Con or Pro Controller, in any configuration, and may switch controllers between games. No personal controllers for match play.'
        ]},
        { title: 'Win Conditions & Draws', items: [
          "A game is won by eliminating the opposing team's stock.",
          'If the timer runs out: the team with more combined stock wins. If stock is level, the game goes to Sudden Death — the console puts the surviving fighters on one stock at 300% and the next KO decides it. Damage percentages are not used to break a tie.',
          'Self-destructs count as-is — a stock lost to a self-destruct or suicide move simply counts; no special ruling.',
          "Tied game (equal stock at time, or a simultaneous final KO): resolved by the game's built-in Sudden Death — surviving fighters go to one stock at 300% and the next KO wins. Applies in both the group and knockout stages; no game ends in a draw."
        ]},
        { title: 'Group Stage', items: [
          'Teams are drawn into groups of 4 teams (odd amounts of teams will result in groups of 3) — round-robin: a group of 4 plays 6 matches, a group of 3 plays 3.',
          'Points per match: Win = 3, Loss = 0. (Every game produces a winner, so matches always finish 2–0 or 2–1.)',
          'Tiebreakers (in order): 1) record / points, 2) head-to-head result, 3) remaining-stock differential (every stock a team had left across its group games, minus every stock its opponents had left).',
          'Top two teams from each group advance to the elimination bracket.'
        ]},
        { title: 'Elimination Bracket', items: [
          'Single-elimination, best of 3, same game settings.',
          'Seeding: group winners are seeded to avoid meeting each other in the first round.',
          'Bracket and standings are posted live on the PSD Esports website.'
        ]},
        { title: 'Match Operations & Rulings', items: [
          'Wrong game settings: immediate restart of that game.',
          "Disconnect / controller unplug / crash: the assigned referee rules. Before the first stock is lost, the ref may order a replay. After the first stock is lost, play continues at the ref's discretion.",
          'No-show / late: 5-minute grace period, then forfeit the first game; 10 minutes, then forfeit the match.',
          'Warm-up: none on tournament stations once play begins. Teams may bring their own Switches for warm-up only (not for match play).',
          'A referee is present at each station. Referee decisions are final.'
        ]},
        { title: 'Conduct & Venue', items: [
          'Good sportsmanship is required. Disruptive, unsafe, or unsportsmanlike behavior may forfeit a game, match, or the tournament at referee discretion.',
          'A roped-off area surrounds each Promethean board; only the active players and referee inside during a game.'
        ]}
      ]
    },

    /* One tab per division, and one bracket page each. Fill in `gid` and that
       division's page comes to life. A null gid is treated as "not set up
       yet" rather than an error.

       The two divisions are drawn independently — different team counts,
       different group counts, even different bracket depths are all fine,
       because each page reads its own tab and works out the shape from what
       is actually there. */
    divisions: [
      { id: 'jr', name: 'Grade 5 & Under', accent: '#FF6B6B',
        page: 'grade-5-under.html', gid: '0' },
      { id: 'sr', name: 'Grades 6–8', accent: '#4DABF7',
        page: 'grades-6-8.html', gid: '86502539' }
    ]
  };

  /* ---- text helpers ------------------------------------------------------ */

  function norm(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]/g, '');
  }

  function txt(s) { return String(s == null ? '' : s).trim(); }
  function isBlank(s) { return txt(s) === ''; }

  /* ---- CSV ---------------------------------------------------------------

     A real parser rather than split(','), because gviz quotes every field.
     ------------------------------------------------------------------------ */

  function parseCSV(text) {
    var rows = [], row = [], cur = '', inQuotes = false, i = 0;
    var s = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    while (i < s.length) {
      var c = s.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (s.charAt(i + 1) === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else cur += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(cur); cur = '';
      } else if (c === '\n') {
        row.push(cur); rows.push(row); row = []; cur = '';
      } else {
        cur += c;
      }
      i++;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }

    return rows.map(function (r) {
      return r.map(function (cell) { return cell.trim(); });
    });
  }

  /* ---- grid helpers ------------------------------------------------------ */

  /**
   * One cell, or '' if it is not there.
   *
   * Callers routinely ask for rows that do not exist — an elimination slot
   * with nothing typed into it yet has no rows at all, so the row index comes
   * through as undefined. That is an ordinary empty cell, not an error.
   */
  function at(grid, r, c) {
    if (typeof r !== 'number' || r < 0 || r >= grid.length) return '';
    var row = grid[r];
    if (!row) return '';
    if (typeof c !== 'number' || c < 0 || c >= row.length) return '';
    return txt(row[c]);
  }

  /** First row index at or after `from` holding a cell matching `re`. */
  function findRow(grid, re, from) {
    for (var r = from || 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (re.test(txt(grid[r][c]))) return r;
      }
    }
    return -1;
  }

  /** Rows are dense (gviz drops blanks), so "is this a header" = has an R1. */
  function bandsIn(row) {
    var out = [];
    if (!row) return out;
    row.forEach(function (cell, c) {
      if (norm(cell) === 'r1') out.push({ nameCol: c - 1, cols: [c, c + 1, c + 2] });
    });
    return out;
  }

  function isHeaderRow(row) { return bandsIn(row).length > 0; }

  /* ---- reading a match ---------------------------------------------------

     Each team's remaining stock for a game sits on that team's own row, so a
     game's winner is simply whichever row holds the larger number. A blank or
     equal pair means the game has not been played.
     ------------------------------------------------------------------------ */

  function readGames(grid, rowTop, rowBottom, cols, label, warn) {
    var games = [];
    cols.forEach(function (c, gi) {
      var a = at(grid, rowTop, c), b = at(grid, rowBottom, c);
      if (isBlank(a) && isBlank(b)) return;

      var na = Number(a) || 0, nb = Number(b) || 0;
      if (na === nb) {
        if (na > 0) {
          warn(label + ': game ' + (gi + 1) + ' has the same stock on both rows (' +
               na + '), so there is no winner. One of them needs correcting.');
        }
        return;   /* 0-0 simply means not played yet */
      }
      games.push({ top: na, bottom: nb, topWon: na > nb });
    });
    return games;
  }

  function matchScore(m) {
    var a = 0, b = 0;
    m.games.forEach(function (g) { if (g.topWon) a++; else b++; });
    return { a: a, b: b, done: a === 2 || b === 2 };
  }

  /* ---- roster ------------------------------------------------------------

     Above the round-robin title: a row of group names, teams listed beneath
     each. One column per group here, unlike the four-column match bands.
     ------------------------------------------------------------------------ */

  function readRoster(grid, endRow) {
    var groups = [];
    if (endRow <= 0) return groups;

    grid[0].forEach(function (cell, c) {
      if (isBlank(cell)) return;
      var teams = [];
      for (var r = 1; r < endRow; r++) {
        var v = at(grid, r, c);
        if (isBlank(v)) break;
        teams.push(v);
      }
      if (teams.length) groups.push({ name: txt(cell), teams: teams });
    });
    return groups;
  }

  /* ---- round robin ------------------------------------------------------- */

  function readGroupMatches(grid, headerRow, endRow, groups, warn) {
    var bands = bandsIn(grid[headerRow]);
    var out = [];

    bands.forEach(function (b, bi) {
      var group = groups[bi];
      var groupName = group ? group.name : 'Group ' + (bi + 1);

      /* every named row in this band's column, in order */
      var rows = [];
      for (var r = headerRow + 1; r < endRow; r++) {
        if (!isBlank(at(grid, r, b.nameCol))) rows.push(r);
      }

      if (rows.length % 2) {
        warn(groupName + ' has an odd number of team rows (' + rows.length +
             '), so the last one has no opponent and is being ignored.');
      }

      for (var i = 0; i + 1 < rows.length; i += 2) {
        var top = at(grid, rows[i], b.nameCol);
        var bottom = at(grid, rows[i + 1], b.nameCol);
        var label = groupName + ' — ' + top + ' v ' + bottom;
        out.push({
          group: groupName,
          teams: [top, bottom],
          games: readGames(grid, rows[i], rows[i + 1], b.cols, label, warn)
        });
      }

      /* a name in the matches that is not on the roster is almost always a
         typo, and would otherwise just quietly not count */
      if (group) {
        var known = {};
        group.teams.forEach(function (t) { known[norm(t)] = true; });
        out.forEach(function (m) {
          if (m.group !== groupName) return;
          m.teams.forEach(function (t) {
            if (!known[norm(t)]) {
              warn(groupName + ': "' + t + '" appears in the matches but is not in ' +
                   'the team list at the top, so its results are not counted.');
            }
          });
        });
      }
    });

    return out;
  }

  /* ---- elimination -------------------------------------------------------

     Each label row ("Quarter Final 1", "Semi Final 1", "Final", "Third")
     carries its own R1/R2/R3 bands. The two teams are simply the first two
     names under the label, typed in by hand as the bracket fills out.
     ------------------------------------------------------------------------ */

  var ROUND_ORDER = [
    { re: /round\s*of\s*32/i, rank: 0, name: 'Round of 32' },
    { re: /round\s*of\s*16/i, rank: 1, name: 'Round of 16' },
    { re: /quarter/i,         rank: 2, name: 'Quarter-finals' },
    { re: /semi/i,            rank: 3, name: 'Semi-finals' },
    { re: /third|bronze|3rd/i, rank: 5, name: 'Third Place' },
    { re: /final/i,           rank: 4, name: 'Final' }
  ];

  function roundOf(label) {
    for (var i = 0; i < ROUND_ORDER.length; i++) {
      if (ROUND_ORDER[i].re.test(label)) return ROUND_ORDER[i];
    }
    return null;
  }

  function readKnockout(grid, startRow, warn) {
    var labelRows = [];
    for (var r = startRow; r < grid.length; r++) {
      if (isHeaderRow(grid[r])) labelRows.push(r);
    }

    var out = [];
    labelRows.forEach(function (lr, idx) {
      var bands = bandsIn(grid[lr]);
      var endRow = (idx + 1 < labelRows.length) ? labelRows[idx + 1] : grid.length;

      bands.forEach(function (b) {
        var label = at(grid, lr, b.nameCol);
        if (isBlank(label)) return;

        var round = roundOf(label);
        if (!round) {
          warn('Elimination: "' + label + '" is not a round name I recognise ' +
               '(expected Quarter Final, Semi Final, Final or Third).');
          return;
        }

        var rows = [];
        for (var r = lr + 1; r < endRow; r++) {
          if (!isBlank(at(grid, r, b.nameCol))) rows.push(r);
        }

        var teams = [at(grid, rows[0], b.nameCol), at(grid, rows[1], b.nameCol)];
        out.push({
          label: label,
          round: round.name,
          rank: round.rank,
          isThird: round.rank === 5,
          teams: [teams[0] || '', teams[1] || ''],
          games: rows.length >= 2
            ? readGames(grid, rows[0], rows[1], b.cols, label, warn)
            : []
        });
      });
    });

    return out;
  }

  /* ---- one tab ------------------------------------------------------------ */

  function readTab(csv, warn) {
    var grid = parseCSV(csv);
    if (!grid.length) { warn('That tab came back empty.'); return null; }

    var rrTitle = findRow(grid, /round\s*robin/i, 0);
    var elimTitle = findRow(grid, /elimination/i, 0);

    if (rrTitle === -1) {
      warn('Could not find a "Round Robin Matches" heading on this tab.');
      return null;
    }

    var rrHeader = -1;
    for (var r = rrTitle + 1; r < grid.length; r++) {
      if (isHeaderRow(grid[r])) { rrHeader = r; break; }
    }
    if (rrHeader === -1) {
      warn('Found the Round Robin heading but no R1 / R2 / R3 row under it.');
      return null;
    }

    var groups = readRoster(grid, rrTitle);
    if (!groups.length) warn('No group/team list found above the Round Robin heading.');

    var rrEnd = elimTitle === -1 ? grid.length : elimTitle;

    return {
      groups: groups,
      groupMatches: readGroupMatches(grid, rrHeader, rrEnd, groups, warn),
      koMatches: elimTitle === -1 ? [] : readKnockout(grid, elimTitle + 1, warn)
    };
  }

  /* ---- fetching ----------------------------------------------------------

     Self-contained rather than reusing PSD.fetchCSV: that helper is shared by
     eight Rocket League pages and normalises gviz back into published-CSV
     shape, which this reader does not want.
     ------------------------------------------------------------------------ */

  var TIMEOUT_MS = 9000;

  /**
   * One tab, as CSV.
   *
   * headers=0 is not optional. Left to itself gviz GUESSES how many leading
   * rows are headers, column by column, from the data types it finds — and
   * then joins every row it guessed into one. On this sheet that turned
   * column A's first five rows into the single cell
   *
   *     "Group 1 A B C Round Robin Matches"
   *
   * while column B, which had numbers in it, kept fewer. Worse, the guess
   * CHANGES as scores are entered, so a sheet that reads perfectly during
   * setup silently reshapes itself once the tournament starts. headers=0
   * says "there are no header rows, give me every row as data".
   */
  function tabUrl(gid) {
    return 'https://docs.google.com/spreadsheets/d/' + CONFIG.sheetId +
           '/gviz/tq?tqx=out:csv&headers=0&gid=' + gid + '&_=' + Date.now();
  }

  function wiredDivisions() {
    return CONFIG.divisions.filter(function (d) { return !isBlank(d.gid); });
  }

  function isWired() { return !isBlank(CONFIG.sheetId) && wiredDivisions().length > 0; }

  function fetchTab(gid) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    var init = { cache: 'no-store' };
    if (ctrl) init.signal = ctrl.signal;

    return fetch(tabUrl(gid), init).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('tab ' + gid + ' → HTTP ' + res.status);
      return res.text();
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  /* ---- public API --------------------------------------------------------- */

  /**
   * Read every wired tab.
   *
   * Resolves to { divisions, warnings, loadedAt }. Rejects only if nothing
   * could be read at all, so one slow tab degrades to a missing division
   * rather than a blank page.
   */
  function load() {
    if (!isWired()) {
      return Promise.reject(new Error('No sheet configured yet — see data/smash.js.'));
    }

    var divs = wiredDivisions();
    var warnings = [];
    var warn = function (msg) { if (warnings.indexOf(msg) === -1) warnings.push(msg); };

    return Promise.all(divs.map(function (d) {
      return fetchTab(d.gid).then(function (csv) {
        return { id: d.id, data: readTab(csv, function (m) { warn(d.name + ' — ' + m); }) };
      }, function (err) {
        warn(d.name + ' — could not be read: ' + err.message);
        return { id: d.id, data: null };
      });
    })).then(function (results) {
      var out = {}, any = false;
      results.forEach(function (r) {
        if (r.data) any = true;
        out[r.id] = r.data || { groups: [], groupMatches: [], koMatches: [] };
      });
      if (!any) throw new Error('No division could be read from the sheet.');
      return { divisions: out, warnings: warnings, loadedAt: new Date() };
    });
  }

  root.SMASH = {
    config: CONFIG,
    isWired: isWired,
    load: load,
    tabUrl: tabUrl,
    matchScore: matchScore,
    /* exported for the page and for testing */
    norm: norm,
    parseCSV: parseCSV,
    bandsIn: bandsIn,
    readRoster: readRoster,
    readTab: readTab
  };

})(window);
