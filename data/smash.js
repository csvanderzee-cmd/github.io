/* ==========================================================================
   PSD Esports — Smash tournament wiring.

   THIS IS THE ONLY FILE YOU EDIT TO POINT THE BRACKET AT A SHEET.

   The tournament is a one-day event with its own workbook, so it is kept
   separate from data/leagues.js, which carries the season-long Rocket League
   config. Nothing here depends on that file.

   ---- Setting it up -------------------------------------------------------

   1. Build the workbook with two tabs, "Teams" and "Matches". The exact
      layout is documented under COLUMNS below. Column ORDER does not matter
      and neither does letter case — every column is found by its header
      text, so you can add, move or rename-around columns freely.

   2. Decide how the page reads it:

      source: 'gviz'       Share > General access > "Anyone with the link"
                           set to VIEWER. Paste the id out of the normal
                           sheet URL into `sheetId`:
                             docs.google.com/spreadsheets/d/<THIS BIT>/edit
                           Scores appear on the site within seconds. Anyone
                           with the link can open the workbook read-only,
                           which is usually fine for a public bracket.

      source: 'published'  File > Share > Publish to web > CSV. Paste the
                           long "2PACX-..." id into `publishId`. The workbook
                           itself stays private, but Google caches the CSV,
                           so a score can take a few minutes to show up.

      Use 'gviz' on tournament day. 'published' is the safer choice if the
      workbook holds anything you would not want a visitor to read.

   3. Paste each tab's gid — the number at the end of the URL after "#gid="
      when that tab is open.

   The page only ever READS. Nothing a visitor does can write back, and the
   sheet is the single source of truth for what is on screen.
   ========================================================================== */

(function (root) {
  'use strict';

  var CONFIG = {

    /* ---- event ---------------------------------------------------------- */

    eventName: 'Super Smash Bros. Tournament',
    /* 'YYYY-MM-DD' once it is set; null keeps the date chip off the page. */
    eventDate: null,
    venue: null,

    /* ---- workbook ------------------------------------------------------- */

    source: 'gviz',        /* 'gviz' | 'published' */

    sheetId: null,         /* gviz mode:      docs.google.com/spreadsheets/d/<ID>/edit */
    publishId: null,       /* published mode: the long 2PACX-... id */

    tabs: {
      teams: null,         /* gid of the Teams tab */
      matches: null        /* gid of the Matches tab */
    },

    /* How often the page re-reads the sheet, in seconds. 30 keeps a room-
       facing bracket feeling live without hammering Google. */
    refreshSeconds: 30,

    /* ---- format --------------------------------------------------------- */

    advance: 2,            /* teams out of each group */
    maxStock: 6,           /* 2 players x 3 stock */
    thirdPlace: true,      /* play off for third */

    divisions: [
      {
        id: 'jr',
        name: 'Grade 5 & Under',
        accent: '#FF6B6B',
        /* Anything the Division column might say for this division. Case,
           spaces and punctuation are ignored, so "grade 5 and under" and
           "Grade 5 & Under" both match without an entry. */
        aliases: ['G5', 'Grade 5', '5 and under', 'Elementary']
      },
      {
        id: 'sr',
        name: 'Grades 6–8',
        accent: '#4DABF7',
        aliases: ['G6-8', 'Grades 6-8', '6-8', 'Middle School', 'MS']
      }
    ]
  };

  /* ==========================================================================
     COLUMNS

     Tab "Teams"
       Division   required   which division the team plays in
       Team       required   the team's display name, e.g. "Shadow Hills Red"
       Group      required   a single letter, A / B / C ...
       Player 1   optional
       Player 2   optional
       Alternate  optional

     Tab "Matches"
       Division   required   as above
       Stage      required   "Group" for a group match, otherwise the bracket
                             slot: QF1..QF4, SF1, SF2, FINAL, THIRD, R16-1...
       Team A     group only the two teams in a group match. LEAVE BLANK on
       Team B                bracket rows — the page works out who is in each
                             slot from the group tables and earlier rounds.
       Game 1     optional   who won that game: A, B, or the team's name
       Game 2     optional
       Game 3     optional
       Stock 1    optional   stock the WINNER of game 1 had left, 1-6
       Stock 2    optional   only used for the group stock tiebreaker; blank
       Stock 3    optional   is fine and simply scores 0
       Station    optional   shown on the match row if present
       Time       optional

     A match with fewer than two game winners reads as "not finished yet" and
     shows as upcoming. Nothing else needs to be filled in or cleared.
     ========================================================================== */

  var COLUMNS = {
    teams: {
      division:  ['division', 'div'],
      team:      ['team', 'team name'],
      group:     ['group', 'pool'],
      player1:   ['player 1', 'player1', 'p1'],
      player2:   ['player 2', 'player2', 'p2'],
      alternate: ['alternate', 'alt', 'sub']
    },
    matches: {
      division: ['division', 'div'],
      stage:    ['stage', 'round'],
      group:    ['group', 'pool'],
      teamA:    ['team a', 'teama', 'team 1', 'home'],
      teamB:    ['team b', 'teamb', 'team 2', 'away'],
      g1:       ['game 1', 'game1', 'g1'],
      g2:       ['game 2', 'game2', 'g2'],
      g3:       ['game 3', 'game3', 'g3'],
      s1:       ['stock 1', 'stock1', 's1'],
      s2:       ['stock 2', 'stock2', 's2'],
      s3:       ['stock 3', 'stock3', 's3'],
      station:  ['station', 'setup', 'board'],
      time:     ['time', 'start']
    }
  };

  /* ---- text helpers ------------------------------------------------------ */

  /**
   * Lowercase, strip everything but letters and digits.
   *
   * "&" becomes "and" first, so "Grade 5 & Under" and "Grade 5 and Under"
   * are the same string here. Without that they differ, and a division typed
   * the long way in the sheet would silently match nothing.
   */
  function norm(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]/g, '');
  }

  function isBlank(s) { return String(s == null ? '' : s).trim() === ''; }

  /* ---- CSV ---------------------------------------------------------------

     A real parser rather than split(','), because a roster cell like
     "Ava R., Marcus T." is quoted and carries a comma inside it.
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

  /**
   * Find the header row and map canonical field names onto column indexes.
   *
   * The header is searched for rather than assumed to be row 1: the gviz and
   * published endpoints do not agree on whether they emit a header line, and
   * people leave title rows above their tables. The first row that carries at
   * least two recognised labels wins.
   */
  function indexColumns(rows, spec) {
    var keys = Object.keys(spec);

    for (var r = 0; r < Math.min(rows.length, 10); r++) {
      var map = {}, hits = 0;
      rows[r].forEach(function (cell, ci) {
        var n = norm(cell);
        if (!n) return;
        keys.forEach(function (key) {
          if (map[key] !== undefined) return;
          var matched = spec[key].some(function (label) { return norm(label) === n; });
          if (matched) { map[key] = ci; hits++; }
        });
      });
      if (hits >= 2) return { headerRow: r, cols: map };
    }
    return null;
  }

  function cell(row, cols, key) {
    var i = cols[key];
    return i === undefined || i === null ? '' : (row[i] === undefined ? '' : row[i]);
  }

  /* ---- fetching ----------------------------------------------------------

     Self-contained rather than reusing PSD.fetchCSV from data/psd-data.js:
     that helper builds a published-CSV URL internally and has no way to emit
     a gviz one, and the eight Rocket League pages depend on it, so widening
     it for a single tournament page is not worth the blast radius.
     ------------------------------------------------------------------------ */

  var TIMEOUT_MS = 9000;

  function tabUrl(gid) {
    var bust = '_=' + Date.now();   /* defeats the browser cache; gviz is fresh anyway */
    if (CONFIG.source === 'gviz') {
      return 'https://docs.google.com/spreadsheets/d/' + CONFIG.sheetId +
             '/gviz/tq?tqx=out:csv&gid=' + gid + '&' + bust;
    }
    return 'https://docs.google.com/spreadsheets/d/e/' + CONFIG.publishId +
           '/pub?output=csv&gid=' + gid + '&' + bust;
  }

  /** True once the config points at a real workbook. */
  function isWired() {
    var id = CONFIG.source === 'gviz' ? CONFIG.sheetId : CONFIG.publishId;
    if (isBlank(id)) return false;
    return !isBlank(CONFIG.tabs.teams) && !isBlank(CONFIG.tabs.matches);
  }

  function fetchTab(gid) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    var init = { cache: 'no-store' };
    if (ctrl) init.signal = ctrl.signal;

    return fetch(tabUrl(gid), init).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('gid ' + gid + ' → HTTP ' + res.status);
      return res.text();
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  /* ---- shaping the rows -------------------------------------------------- */

  /* What the Stage column may say for a group match. Anything else is read as
     a bracket slot. Shared with the page so the two can never disagree about
     which rows are group matches. */
  var GROUP_STAGE_KEYS = ['group', 'groupstage', 'groups', 'rr', 'roundrobin', 'pool'];

  function isGroupStage(m) { return GROUP_STAGE_KEYS.indexOf(m.stageKey) !== -1; }

  function divisionOf(text) {
    var n = norm(text);
    if (!n) return null;
    var found = null;
    CONFIG.divisions.forEach(function (d) {
      if (found) return;
      var candidates = [d.id, d.name].concat(d.aliases || []);
      if (candidates.some(function (c) { return norm(c) === n; })) found = d.id;
    });
    return found;
  }

  /**
   * Read a game-winner cell into 'a', 'b' or null.
   * Accepts A/B, 1/2, or either team's name, so a scorekeeper who types the
   * team instead of the letter still gets a recorded result.
   */
  function winnerOf(text, teamA, teamB) {
    var n = norm(text);
    if (!n) return null;
    if (n === 'a' || n === '1' || n === 'teama') return 'a';
    if (n === 'b' || n === '2' || n === 'teamb') return 'b';
    if (teamA && n === norm(teamA)) return 'a';
    if (teamB && n === norm(teamB)) return 'b';
    return null;
  }

  function stockOf(text) {
    var v = parseInt(String(text).replace(/[^0-9]/g, ''), 10);
    if (isNaN(v) || v < 1) return null;
    return Math.min(v, CONFIG.maxStock);
  }

  function readTeams(csv, warn) {
    var rows = parseCSV(csv);
    var idx = indexColumns(rows, COLUMNS.teams);
    if (!idx) {
      warn('The Teams tab has no recognisable header row — it needs at least Division, Team and Group columns.');
      return [];
    }
    var cols = idx.cols;

    return rows.slice(idx.headerRow + 1).map(function (row) {
      var name = cell(row, cols, 'team');
      if (isBlank(name)) return null;

      var rawDiv = cell(row, cols, 'division');
      if (!divisionOf(rawDiv)) {
        warn('Teams tab: "' + name + '" has an unrecognised division ' +
             (isBlank(rawDiv) ? '(blank)' : '"' + rawDiv + '"') + ' and was skipped.');
      } else if (isBlank(cell(row, cols, 'group'))) {
        warn('Teams tab: "' + name + '" has no group and was skipped.');
      }
      var players = [
        cell(row, cols, 'player1'),
        cell(row, cols, 'player2'),
        cell(row, cols, 'alternate')
      ].filter(function (p) { return !isBlank(p); });

      return {
        division: divisionOf(cell(row, cols, 'division')),
        /* the team name IS the id — it is what the Matches tab refers to */
        id: norm(name),
        name: name,
        group: String(cell(row, cols, 'group')).trim().toUpperCase(),
        players: players
      };
    }).filter(function (t) { return t && t.division && t.group; });
  }

  function readMatches(csv, warn) {
    var rows = parseCSV(csv);
    var idx = indexColumns(rows, COLUMNS.matches);
    if (!idx) {
      warn('The Matches tab has no recognisable header row — it needs at least Division and Stage columns.');
      return [];
    }
    var cols = idx.cols;

    return rows.slice(idx.headerRow + 1).map(function (row) {
      var stage = String(cell(row, cols, 'stage')).trim();
      if (isBlank(stage)) return null;

      if (!divisionOf(cell(row, cols, 'division'))) {
        warn('Matches tab: a "' + stage + '" row has an unrecognised division and was skipped.');
      }

      var teamA = cell(row, cols, 'teamA');
      var teamB = cell(row, cols, 'teamB');

      var games = [];
      [['g1', 's1'], ['g2', 's2'], ['g3', 's3']].forEach(function (pair) {
        var w = winnerOf(cell(row, cols, pair[0]), teamA, teamB);
        if (!w) return;
        games.push({ w: w, stock: stockOf(cell(row, cols, pair[1])) });
      });

      return {
        division: divisionOf(cell(row, cols, 'division')),
        stage: stage,
        stageKey: norm(stage),
        group: String(cell(row, cols, 'group')).trim().toUpperCase(),
        teamA: teamA, teamAId: norm(teamA),
        teamB: teamB, teamBId: norm(teamB),
        games: games,
        station: cell(row, cols, 'station'),
        time: cell(row, cols, 'time')
      };
    }).filter(function (m) { return m && m.division; });
  }

  /* ---- public API -------------------------------------------------------- */

  /**
   * Read both tabs and shape them per division.
   *
   * Resolves to { divisions: { <id>: { teams, groups, matches } }, loadedAt }.
   * Rejects if either tab cannot be read, so the page can keep showing the
   * last good data rather than blanking out on one dropped request.
   */
  function load() {
    if (!isWired()) {
      return Promise.reject(new Error('No sheet configured yet — see data/smash.js.'));
    }

    return Promise.all([
      fetchTab(CONFIG.tabs.teams),
      fetchTab(CONFIG.tabs.matches)
    ]).then(function (csv) {
      /* Problems are collected rather than thrown. A single mistyped cell
         should not blank the bracket, but it must not vanish silently either:
         a group match whose team name does not match the Teams tab would
         otherwise just never count, and the standings would look fine while
         being wrong. */
      var warnings = [];
      var warn = function (msg) { if (warnings.indexOf(msg) === -1) warnings.push(msg); };

      var teams = readTeams(csv[0], warn);
      var matches = readMatches(csv[1], warn);

      var out = {};
      CONFIG.divisions.forEach(function (d) {
        var dTeams = teams.filter(function (t) { return t.division === d.id; });

        /* groups come straight from the Group column, in letter order */
        var byGroup = {};
        dTeams.forEach(function (t) {
          if (!byGroup[t.group]) byGroup[t.group] = [];
          byGroup[t.group].push(t.id);
        });
        var groups = Object.keys(byGroup).sort().map(function (name) {
          return { name: name, teams: byGroup[name] };
        });

        var dMatches = matches.filter(function (m) { return m.division === d.id; });

        /* A group match names its two teams. If either name is not on the
           Teams tab the match cannot be scored, so say which one. */
        var known = {};
        dTeams.forEach(function (t) { known[t.id] = true; });
        dMatches.forEach(function (m) {
          if (GROUP_STAGE_KEYS.indexOf(m.stageKey) === -1) return;
          [[m.teamA, m.teamAId], [m.teamB, m.teamBId]].forEach(function (pair) {
            if (isBlank(pair[0])) {
              warn(d.name + ': a group match row is missing a team name.');
            } else if (!known[pair[1]]) {
              warn(d.name + ': group match team "' + pair[0] +
                   '" is not on the Teams tab, so that match is not being counted.');
            }
          });
        });

        out[d.id] = { teams: dTeams, groups: groups, matches: dMatches };
      });

      return { divisions: out, loadedAt: new Date(), warnings: warnings };
    });
  }

  root.SMASH = {
    config: CONFIG,
    columns: COLUMNS,
    isWired: isWired,
    load: load,
    tabUrl: tabUrl,
    groupStageKeys: GROUP_STAGE_KEYS,
    isGroupStage: isGroupStage,
    /* exported for the page and for testing */
    norm: norm,
    parseCSV: parseCSV,
    indexColumns: indexColumns,
    readTeams: readTeams,
    readMatches: readMatches,
    divisionOf: divisionOf,
    winnerOf: winnerOf
  };

})(window);
