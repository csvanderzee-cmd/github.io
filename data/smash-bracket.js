/* ==========================================================================
   PSD Esports — Smash bracket page.

   One division per page. Both bracket pages load this same file and differ
   only in which division they hand to SMASH_PAGE.init(), so the two can never
   drift apart in how they compute a table or draw a bracket.

   READ ONLY. Everything comes from the Google Sheet wired up in data/smash.js;
   the page never writes anywhere, so a visitor cannot change what anyone else
   sees. To correct a score, fix the sheet.

   Group tables are computed here rather than read from the sheet, so points,
   tiebreakers and who qualifies can never drift out of step with the recorded
   games. The bracket teams are whatever has been typed into the elimination
   rows — the sheet is the authority there, since a referee's call on the day
   beats anything computed.
   ========================================================================== */

(function (root) {
  'use strict';

  var CFG, ADVANCE, norm, DIV;

  var state = {
    data: null,
    loadedAt: null,
    error: null,
    loading: false
  };

  var EMPTY = { drawn: false, groups: [], groupMatches: [], koMatches: [] };

  function div() {
    if (!state.data) return EMPTY;
    return state.data.divisions[DIV.id] || EMPTY;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isPow2(n) { return n > 1 && (n & (n - 1)) === 0; }
  function byId(id) { return document.getElementById(id); }

  /* ---- standings --------------------------------------------------------

     Stock differential is every stock this team had left across the group,
     minus every stock its opponents had left. Because each team's stock is
     recorded on its own row in the sheet, a game that ran the timer out —
     where both sides finish with stock — comes out exactly right rather than
     being rounded to the winner's count.
     ----------------------------------------------------------------------- */

  function standings(gi) {
    var g = div().groups[gi];
    if (!g) return [];

    var rows = g.teams.map(function (name) {
      return { name: name, p: 0, w: 0, l: 0, gw: 0, gl: 0, sf: 0, sa: 0, sd: 0, pts: 0 };
    });
    var byName = {};
    rows.forEach(function (r) { byName[norm(r.name)] = r; });

    var played = [];

    div().groupMatches.forEach(function (m) {
      if (m.group !== g.name) return;
      var s = root.SMASH.matchScore(m);
      if (!s.done) return;

      var A = byName[norm(m.teams[0])], B = byName[norm(m.teams[1])];
      if (!A || !B) return;

      played.push({ a: A.name, b: B.name, winner: s.a > s.b ? A.name : B.name });

      A.p++; B.p++;
      A.gw += s.a; A.gl += s.b;
      B.gw += s.b; B.gl += s.a;

      m.games.forEach(function (gm) {
        A.sf += gm.top;    A.sa += gm.bottom;
        B.sf += gm.bottom; B.sa += gm.top;
      });

      if (s.a > s.b) { A.w++; A.pts += 3; B.l++; }
      else           { B.w++; B.pts += 3; A.l++; }
    });

    rows.forEach(function (r) { r.sd = r.sf - r.sa; });

    rows.sort(function (x, y) {
      return y.pts - x.pts || y.sd - x.sd || y.gw - x.gw || x.name.localeCompare(y.name);
    });

    /* Head-to-head sits above stock differential, so re-sort each block of
       teams level on points using only the matches they played against one
       another. For two teams that is the head-to-head result; for three or
       more it is the usual mini-table. */
    var i = 0;
    while (i < rows.length) {
      var j = i;
      while (j + 1 < rows.length && rows[j + 1].pts === rows[i].pts) j++;
      if (j > i) {
        var block = rows.slice(i, j + 1);
        var mini = {};
        block.forEach(function (r) { mini[r.name] = 0; });
        played.forEach(function (mm) {
          if (mini[mm.a] === undefined || mini[mm.b] === undefined) return;
          mini[mm.winner] += 3;
        });
        block.sort(function (x, y) {
          return mini[y.name] - mini[x.name] || y.sd - x.sd ||
                 y.gw - x.gw || x.name.localeCompare(y.name);
        });
        for (var k = 0; k < block.length; k++) rows[i + k] = block[k];
      }
      i = j + 1;
    }

    return rows;
  }

  function groupComplete(gi) {
    var g = div().groups[gi];
    if (!g || g.teams.length < 2) return false;
    var expected = g.teams.length * (g.teams.length - 1) / 2;
    var done = 0;
    div().groupMatches.forEach(function (m) {
      if (m.group === g.name && root.SMASH.matchScore(m).done) done++;
    });
    return done >= expected;
  }

  /* ---- who the bracket expects -------------------------------------------

     Bracket teams are typed in by hand, so this is only a hint shown under an
     empty slot: with an even number of groups whose qualifiers make a power of
     two, the World Cup crossing says who belongs there. It never overrides
     what is in the sheet, and it simply does not appear when the group count
     does not divide cleanly.
     ------------------------------------------------------------------------ */

  function crossingHints() {
    var groups = div().groups, G = groups.length;
    if (G < 2 || G % 2 !== 0 || !isPow2(G * ADVANCE)) return null;

    var top = [], bottom = [];
    for (var i = 0; i < G; i += 2) {
      top.push([{ g: i, pos: 0 }, { g: i + 1, pos: 1 }]);
      bottom.push([{ g: i + 1, pos: 0 }, { g: i, pos: 1 }]);
    }
    return top.concat(bottom).map(function (p) {
      return p.map(function (s) {
        return (s.pos === 0 ? 'Winner ' : 'Runner-up ') + groups[s.g].name;
      });
    });
  }

  /* ---- bracket ----------------------------------------------------------- */

  function bracket() {
    var ko = div().koMatches;
    if (!ko.length) return null;

    var main = ko.filter(function (m) { return !m.isThird; })
                 .slice().sort(function (a, b) { return a.rank - b.rank; });
    var third = ko.filter(function (m) { return m.isThird; })[0] || null;

    var rounds = [];
    main.forEach(function (m) {
      var last = rounds[rounds.length - 1];
      if (!last || last.rank !== m.rank) {
        rounds.push({ rank: m.rank, name: m.round, matches: [] });
        last = rounds[rounds.length - 1];
      }
      last.matches.push(m);
    });

    function decorate(m) {
      var s = root.SMASH.matchScore(m);
      m.scoreA = s.a; m.scoreB = s.b; m.done = s.done;
      m.winner = s.done ? (s.a > s.b ? m.teams[0] : m.teams[1]) : null;
    }
    rounds.forEach(function (rd) { rd.matches.forEach(decorate); });
    if (third) decorate(third);

    var hints = crossingHints();
    if (hints && rounds.length && rounds[0].matches.length === hints.length) {
      rounds[0].matches.forEach(function (m, i) { m.hints = hints[i]; });
    }

    return { rounds: rounds, third: third };
  }

  /* ==================================================================
     Rendering
     ================================================================== */

  function emptyState(title, body) {
    return '<div class="border border-dashed border-white/10 rounded-2xl p-10 text-center">' +
           '<p class="font-display text-lg font-black uppercase italic text-gray-500 mb-1">' + esc(title) + '</p>' +
           '<p class="text-sm text-gray-600">' + esc(body) + '</p></div>';
  }

  /** "on Saturday 7 November", "in November", or '' — whatever we honestly have. */
  function whenPhrase() {
    if (CFG.eventDate) {
      var d = new Date(CFG.eventDate + 'T00:00:00');
      if (!isNaN(d)) {
        return ' on ' + d.toLocaleDateString(undefined,
          { weekday: 'long', day: 'numeric', month: 'long' });
      }
    }
    return '';
  }

  /* ---- what a screen reader hears ------------------------------------------

     The winner of a match is shown by bold white text, which says nothing to
     someone listening. So every match carries a plain sentence for screen
     readers ("Falcons beat Hawks 2 to 1") and the visual row is hidden from
     them, rather than leaving them to guess from a run of names and digits.
     ------------------------------------------------------------------------ */

  function sr(text) { return '<span class="sr-only">' + esc(text) + '</span>'; }

  function matchSentence(a, b, s) {
    if (!a || !b) return (a || 'To be decided') + ' versus ' + (b || 'to be decided') + ', not played yet';
    if (!s.done) {
      return (s.a + s.b) > 0
        ? a + ' versus ' + b + ', in progress, ' + s.a + ' to ' + s.b
        : a + ' versus ' + b + ', not played yet';
    }
    return s.a > s.b ? a + ' beat ' + b + ' ' + s.a + ' to ' + s.b
                     : b + ' beat ' + a + ' ' + s.b + ' to ' + s.a;
  }

  function fixtureRow(m) {
    var s = root.SMASH.matchScore(m);
    var aWon = s.done && s.a > s.b, bWon = s.done && s.b > s.a;
    var chip = s.done ? s.a + ' – ' + s.b : 'vs';
    return '<li class="fix-wrap">' + sr(matchSentence(m.teams[0], m.teams[1], s)) +
           '<div class="fix-row" aria-hidden="true">' +
             '<span class="side' + (aWon ? ' won' : '') + '">' + esc(m.teams[0]) + '</span>' +
             '<span class="fix-score' + (s.done ? ' done' : '') + '">' + esc(chip) + '</span>' +
             '<span class="side right' + (bWon ? ' won' : '') + '">' + esc(m.teams[1]) + '</span>' +
           '</div></li>';
  }

  /* Column headings are abbreviated to fit; each also carries its full name,
     read aloud in place of the letters and shown on hover. */
  var COLUMNS = [['#', 'Position'], ['Team', 'Team'], ['P', 'Played'], ['W', 'Won'], ['L', 'Lost'],
                 ['Gm', 'Games won and lost'], ['SD', 'Stock differential'], ['Pts', 'Points']];

  function columnHead(c) {
    return c[0] === c[1]
      ? '<th scope="col">' + esc(c[0]) + '</th>'
      : '<th scope="col" title="' + esc(c[1]) + '"><span aria-hidden="true">' + esc(c[0]) + '</span>' + sr(c[1]) + '</th>';
  }

  function renderGroups() {
    var wrap = byId('groups-wrap');
    var d = div();

    if (!root.SMASH.isWired() || !DIV.gid) {
      wrap.innerHTML = emptyState('No tab connected for this division',
        'Add this division’s tab gid in data/smash.js and the tournament appears here.');
      return;
    }
    if (!state.data) {
      wrap.innerHTML = emptyState(state.error ? 'Could not reach the sheet' : 'Loading…',
        state.error ? state.error : 'Reading teams and scores.');
      return;
    }
    /* Not drawn yet is the ordinary state of this page between tournaments, so
       it gets a sentence that reads like an announcement rather than a fault. */
    if (!d.drawn) {
      wrap.innerHTML = emptyState('Groups not drawn yet',
        'Teams are drawn into groups once registration closes. Tables and ' +
        'fixtures appear here on their own, and update live' + whenPhrase() + '.');
      return;
    }
    if (!d.groups.length) {
      wrap.innerHTML = emptyState('No teams found',
        'Expected group names in row 1 with the teams listed underneath.');
      return;
    }

    wrap.innerHTML =
      /* A visible key, so the abbreviations are not a puzzle for anyone. */
      '<p class="text-[11px] text-gray-500 mb-4">' +
        'P played · W won · L lost · Gm games won–lost · SD stock differential · Pts points. ' +
        'The highlighted top ' + ADVANCE + ' in each group advance.</p>' +
      '<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">' +
      d.groups.map(function (g, gi) {
        var rows = standings(gi);
        var complete = groupComplete(gi);
        var ms = d.groupMatches.filter(function (m) { return m.group === g.name; });

        var table = '<table class="grp-table">' +
          '<caption class="sr-only">' + esc(g.name) + ' standings. Top ' + ADVANCE + ' advance.</caption>' +
          '<thead><tr>' + COLUMNS.map(columnHead).join('') + '</tr></thead><tbody>' +
          rows.map(function (r, i) {
            /* The yellow edge marks a qualifying place; say it in words too. */
            var place = i < ADVANCE
              ? sr(complete ? ', qualified' : ', currently in a qualifying place') : '';
            return '<tr class="' + (i < ADVANCE ? 'qualified' : '') + '">' +
              '<td class="pos">' + (i + 1) + '</td>' +
              '<td class="nm">' + esc(r.name) + place + '</td>' +
              '<td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.l + '</td>' +
              '<td>' + r.gw + '–' + r.gl + '</td>' +
              '<td>' + (r.sd > 0 ? '+' : '') + r.sd + '</td>' +
              '<td class="pts">' + r.pts + '</td></tr>';
          }).join('') + '</tbody></table>';

        return '<div class="bg-esports-card border border-white/5 rounded-2xl p-5">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<h3 class="font-display text-xl font-black uppercase italic">' + esc(g.name) + '</h3>' +
            '<span class="text-[11px] font-display font-bold uppercase tracking-[0.18em] ' +
              (complete ? 'text-esports-yellow-text' : 'text-gray-600') + '">' +
              (complete ? 'Complete' : g.teams.length + ' teams') + '</span>' +
          '</div>' + table +
          '<h4 class="text-[11px] font-display font-bold uppercase tracking-[0.2em] text-gray-600 mt-5 mb-2">' +
            'Matches' + sr(' in ' + g.name) + '</h4>' +
          (ms.length ? '<ul class="space-y-1.5">' + ms.map(fixtureRow).join('') + '</ul>'
                     : '<p class="text-[11px] text-gray-600">No matches listed yet.</p>') +
          '</div>';
      }).join('') + '</div>';
  }

  function bkTeam(name, hint, scoreVal, winner) {
    var known = name && name !== '';
    var isWinner = known && winner && norm(winner) === norm(name);
    var label = known ? name : (hint || 'TBD');
    return '<div class="bk-team' + (isWinner ? ' won' : '') + (known ? '' : ' tbd') + '">' +
           '<span class="nm">' + esc(label) + '</span>' +
           '<span class="sc">' + (scoreVal === null ? '' : scoreVal) + '</span></div>';
  }

  function bkMatch(m, isFinal, label) {
    var show = m.done || (m.scoreA + m.scoreB) > 0;
    var h = m.hints || [];
    /* An empty slot is announced by who the tables say belongs there, when
       that is known, the same as it reads on screen. */
    var a = m.teams[0] || h[0] || '', b = m.teams[1] || h[1] || '';
    return '<div class="bk-match' + (isFinal ? ' final-match' : '') + '" role="group" aria-label="' + esc(label) + '">' +
           sr(matchSentence(a, b, { a: m.scoreA, b: m.scoreB, done: m.done })) +
           '<div aria-hidden="true">' +
             bkTeam(m.teams[0], h[0], show ? m.scoreA : null, m.winner) +
             bkTeam(m.teams[1], h[1], show ? m.scoreB : null, m.winner) +
           '</div></div>';
  }

  function renderBracket() {
    var wrap = byId('bracket-wrap');
    var note = byId('bracket-note');
    var b = state.data ? bracket() : null;

    if (!b) {
      note.textContent = '';
      wrap.innerHTML = (state.data && DIV.gid)
        ? emptyState('Bracket not published yet',
            'The knockout rounds appear here once the group stage is under way.')
        : '';
      return;
    }

    /* Pre-draw the bracket is still worth drawing: an empty ladder of TBDs is
       how a parent finds out the day ends in a final and a third-place match.
       It just should not be described as though results were expected in it. */
    note.textContent = div().drawn
      ? 'Teams fill in as each round is decided. Empty slots show who the group ' +
        'tables say belongs there.'
      : 'How the knockout stage runs. Teams fill in on the day, round by round.';

    /* Each round is a section under its own heading, so a screen-reader user
       can jump round to round the way everyone else scans across the page. */
    /* On a narrow screen the ladder scrolls sideways. tabindex lets a keyboard
       user focus it and scroll with the arrow keys (WCAG 2.1.1). */
    var html = '<div class="bracket" tabindex="0" role="region" aria-label="Elimination bracket">' + b.rounds.map(function (rd, ri) {
      var isLast = ri === b.rounds.length - 1;
      var one = rd.matches.length === 1;
      return '<section class="bk-round" aria-labelledby="bk-round-' + ri + '">' +
             '<h3 class="bk-round-title" id="bk-round-' + ri + '">' + esc(rd.name) + '</h3>' +
             '<div class="bk-body">' + rd.matches.map(function (m, mi) {
               return '<div class="bk-slot">' + bkMatch(m, isLast, one ? rd.name : rd.name + ', match ' + (mi + 1)) +
                      '<span class="bk-conn" aria-hidden="true"></span></div>';
             }).join('') + '</div></section>';
    }).join('') + '</div>';

    if (b.third) {
      html += '<section class="mt-4 max-w-[235px]" aria-labelledby="bk-third">' +
              '<h3 class="bk-round-title" id="bk-third" style="text-align:left">Third Place</h3>' +
              bkMatch(b.third, false, 'Third place match') + '</section>';
    }

    var lastRound = b.rounds[b.rounds.length - 1];
    var champ = lastRound && lastRound.matches.length === 1 ? lastRound.matches[0].winner : null;
    if (champ) {
      html = '<div class="glass-panel rounded-2xl p-6 mb-6 border-l-8 border-esports-yellow">' +
             '<p class="text-[11px] font-display font-bold uppercase tracking-[0.25em] text-gray-500 mb-1">Champions</p>' +
             '<p class="font-display text-3xl font-black uppercase italic text-esports-yellow-text">' +
             esc(champ) + '</p></div>' + html;
    }

    wrap.innerHTML = html;
  }

  function renderWarnings() {
    var host = byId('sheet-warnings');
    var all = (state.data && state.data.warnings) || [];
    /* each page shows only its own division's problems */
    var list = all.filter(function (w) { return w.indexOf(DIV.name) === 0; });
    if (!list.length) { host.className = 'mb-10 hidden no-print'; host.innerHTML = ''; return; }

    host.className = 'mb-10 no-print';
    host.innerHTML =
      '<div class="rounded-2xl border border-esports-yellow/30 bg-esports-yellow/[0.07] p-5">' +
        '<p class="font-display font-bold uppercase tracking-[0.18em] text-xs text-esports-yellow-text mb-2">' +
          'Check the sheet — ' + list.length + ' thing' + (list.length === 1 ? '' : 's') +
          ' could not be read</p>' +
        '<ul class="text-xs text-gray-300 space-y-1 list-disc list-inside">' +
          list.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') +
        '</ul></div>';
  }

  function timeOf(d) {
    return d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—';
  }

  /* ---- telling screen readers what changed --------------------------------

     The status line under the division tabs is rewritten on every poll
     ("Live · updated 4:02 PM"). As a live region it would be read aloud every
     30 seconds, so it is not one. Instead a separate, hidden region speaks only
     when something actually happens: scores change, the feed drops or comes
     back, or updates are paused.
     ------------------------------------------------------------------------ */

  var lastKind = null;

  function announce(text) {
    var host = byId('feed-announce');
    if (!host) return;
    host.textContent = '';
    /* cleared then set on the next frame, so a repeat of the same sentence
       is still announced */
    setTimeout(function () { host.textContent = text; }, 50);
  }

  function noteKind(kind) {
    if (kind === lastKind) return;
    var was = lastKind;
    lastKind = kind;
    if (was === null) return;                       // first paint: nothing has changed yet
    if (kind === 'stale' || kind === 'error') announce('Live scores have lost connection. Showing the last update.');
    else if (kind === 'live' && (was === 'stale' || was === 'error')) announce('Live scores reconnected.');
  }

  function renderStatus() {
    var dot = byId('feed-dot'), txt = byId('feed-text');
    if (!dot || !txt) return;

    if (!root.SMASH.isWired() || !DIV.gid) {
      dot.className = 'feed-dot off'; txt.textContent = 'No sheet connected'; return;
    }
    if (paused) {
      dot.className = 'feed-dot off';
      txt.textContent = 'Paused · last update ' + timeOf(state.loadedAt);
      return;
    }
    if (state.error && !state.data) {
      dot.className = 'feed-dot error'; txt.textContent = 'Cannot reach the sheet'; noteKind('error'); return;
    }
    if (state.error) {
      dot.className = 'feed-dot stale';
      txt.textContent = 'Reconnecting · last update ' + timeOf(state.loadedAt);
      noteKind('stale');
      return;
    }
    if (!state.loading) noteKind('live');
    /* "Live · updated 4:02 PM" over a page with nothing on it reads like the
       feed is broken. Until the draw is out, say what is actually true. */
    if (state.data && !div().drawn) {
      dot.className = 'feed-dot';
      txt.textContent = 'Connected · nothing posted yet';
      return;
    }
    dot.className = 'feed-dot' + (state.loading ? ' loading' : ' live');
    txt.textContent = state.loadedAt ? 'Live · updated ' + timeOf(state.loadedAt) : 'Loading scores…';
  }

  /* Anything else on the page that wants the same numbers — the full-screen
     display mode, for one — registers here and is handed a snapshot after
     every read of the sheet. */
  var watchers = [];

  function renderAll() {
    renderStatus();
    renderWarnings();
    renderGroups();
    renderBracket();
    if (root.lucide && root.lucide.createIcons) root.lucide.createIcons();
    notifyWatchers();
  }

  /* The display mode and anything else registered below hear about every
     read of the sheet, changed or not, so their "updated at" and connection
     state stay current even while this page skips an unchanged redraw. */
  function notifyWatchers() {
    var snap = watchers.length ? snapshot() : null;
    watchers.forEach(function (fn) {
      try { fn(snap); } catch (e) { if (root.console) console.error('[smash] watcher failed:', e); }
    });
  }

  /** Call `fn(snapshot)` after every read of the sheet, and once now if data is in hand. */
  function onUpdate(fn) {
    watchers.push(fn);
    if (state.data || state.error) fn(snapshot());
  }

  /** Everything a page needs to draw this division, as plain data. */
  function snapshot() {
    var d = div();
    return {
      division: DIV,
      drawn: d.drawn,
      wired: root.SMASH.isWired() && !!DIV.gid,
      groups: d.groups.map(function (g, gi) {
        return { name: g.name, rows: standings(gi), complete: groupComplete(gi) };
      }),
      groupsComplete: d.drawn && d.groups.length > 0 &&
                      d.groups.every(function (g, gi) { return groupComplete(gi); }),
      bracket: state.data ? bracket() : null,
      advance: ADVANCE,
      loadedAt: state.loadedAt,
      loading: state.loading,
      error: state.error,
      hasData: !!state.data,
      paused: paused
    };
  }

  /* ==================================================================
     The feed
     ================================================================== */

  /* The tables and bracket are only redrawn when this division's results
     actually change. Rebuilding them on every poll would throw a screen-reader
     user back to the top of the page mid-sentence, and lose anyone's keyboard
     place, twice a minute. */
  var lastSignature = null;

  function signatureOf(payload) {
    var mine = (payload.warnings || []).filter(function (w) { return w.indexOf(DIV.name) === 0; });
    return JSON.stringify([payload.divisions[DIV.id] || null, mine]);
  }

  var paused = false;

  function refresh() {
    if (paused) return;
    if (!root.SMASH.isWired() || !DIV.gid) { renderAll(); return; }
    state.loading = true;
    renderStatus();

    root.SMASH.load().then(function (payload) {
      if (paused) return;
      var sig = signatureOf(payload);
      var changed = sig !== lastSignature || state.error;
      var firstLoad = lastSignature === null;
      lastSignature = sig;
      state.data = payload;
      state.loadedAt = payload.loadedAt;
      state.error = null;
      state.loading = false;
      if (changed) {
        renderAll();
        if (!firstLoad && div().drawn) announce('Scores updated at ' + timeOf(state.loadedAt) + '.');
      } else {
        renderStatus();
        notifyWatchers();
      }
    }, function (err) {
      /* keep the last good bracket on screen rather than blanking out when
         one request times out on school wifi */
      if (root.console && console.warn) console.warn('[smash] refresh failed:', err.message);
      if (paused) return;
      var hadError = !!state.error;
      state.error = err.message;
      state.loading = false;
      /* the first failure changes what is on screen; repeats only the status */
      if (hadError) { renderStatus(); notifyWatchers(); } else renderAll();
    });
  }

  /* ---- pause -------------------------------------------------------------

     WCAG 2.2.2: anything that updates on its own needs a way to stop it. It
     also helps anyone reading a table that keeps moving under them. Paused,
     the page stops polling altogether; resuming catches straight up.
     ------------------------------------------------------------------------ */

  function buildFeedControls() {
    var status = byId('feed-status');
    if (!status) return;

    /* Straight under <body>, not inside the page: the rules dialog and the
       display screen make the page inert while they are open, and the
       announcements have to keep coming through either way. */
    var live = document.createElement('div');
    live.id = 'feed-announce';
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    document.body.appendChild(live);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'feed-pause';
    btn.className = 'no-print';
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'Pause live updates';
    status.appendChild(btn);

    var style = document.createElement('style');
    style.textContent =
      '#feed-pause{margin-left:.5rem;font-family:Rajdhani,sans-serif;font-weight:700;font-size:.68rem;letter-spacing:.12em;' +
        'text-transform:uppercase;color:#e5e7eb;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);' +
        'border-radius:9999px;padding:.3rem .8rem;cursor:pointer;}' +
      '#feed-pause:hover{background:rgba(255,255,255,.1);color:#fff;}' +
      '#feed-pause[aria-pressed="true"]{color:#0B0E14;background:#FDB913;border-color:#FDB913;}';
    document.head.appendChild(style);

    btn.addEventListener('click', function () { setPaused(!paused); });
  }

  /** Pause or resume the feed. The display screen has its own button for this. */
  function setPaused(p) {
    paused = !!p;
    var btn = byId('feed-pause');
    if (btn) {
      btn.setAttribute('aria-pressed', String(paused));
      btn.textContent = paused ? 'Resume live updates' : 'Pause live updates';
    }
    announce(paused ? 'Live updates paused.' : 'Live updates resumed.');
    if (paused) { state.loading = false; renderStatus(); notifyWatchers(); }
    else refresh();
  }

  /* ==================================================================
     Rules bubble

     A floating pill that opens the rulebook summary, stamped with the
     version it came from. Built and injected here rather than written into
     the two bracket pages, so there is one copy of both the markup and the
     text — the pages cannot drift apart, and neither can they drift from
     data/smash.js.
     ================================================================== */

  var RULES_CSS =
    '#rules-fab{position:fixed;right:1.25rem;bottom:1.25rem;z-index:1500;display:flex;align-items:center;gap:.5rem;' +
      'padding:.6rem 1rem;border-radius:9999px;border:1px solid rgba(255,255,255,.16);background:rgba(21,27,38,.92);' +
      'backdrop-filter:blur(10px);color:#e5e7eb;font-family:Rajdhani,sans-serif;font-weight:800;font-size:.72rem;' +
      'letter-spacing:.14em;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.5);transition:all .18s;}' +
    '#rules-fab:hover{background:rgba(31,40,56,.96);border-color:rgba(255,255,255,.3);transform:translateY(-1px);}' +
    '#rules-fab .ver{opacity:.6;font-size:.66rem;}' +
    '#rules-backdrop{position:fixed;inset:0;z-index:1600;background:rgba(5,7,11,.82);backdrop-filter:blur(4px);' +
      'display:none;align-items:center;justify-content:center;padding:1rem;}' +
    '#rules-backdrop.open{display:flex;}' +
    '#rules-card{background:#151B26;border:1px solid rgba(255,255,255,.12);border-radius:1rem;width:100%;' +
      'max-width:640px;max-height:86vh;display:flex;flex-direction:column;}' +
    '#rules-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.25rem 1.5rem;' +
      'border-bottom:1px solid rgba(255,255,255,.1);}' +
    '#rules-body{overflow-y:auto;padding:1.25rem 1.5rem 1.5rem;}' +
    '#rules-body h3{font-family:Rajdhani,sans-serif;font-weight:800;font-size:.68rem;letter-spacing:.2em;' +
      'text-transform:uppercase;color:var(--accent,#FDB913);margin:1.25rem 0 .5rem;}' +
    '#rules-body h3:first-child{margin-top:0;}' +
    '#rules-body ul{margin:0;padding-left:1.1rem;}' +
    '#rules-body li{font-size:.82rem;line-height:1.55;color:#d1d5db;margin-bottom:.4rem;}' +
    '#rules-close{background:none;border:1px solid rgba(255,255,255,.16);color:#9ca3af;border-radius:.4rem;' +
      'width:2rem;height:2rem;font-size:1.1rem;line-height:1;cursor:pointer;flex-shrink:0;}' +
    '#rules-close:hover{color:#fff;border-color:rgba(255,255,255,.35);}' +
    '#rules-changed{font-size:.72rem;color:#FFD166;background:rgba(253,185,19,.1);border:1px solid rgba(253,185,19,.25);' +
      'border-radius:.5rem;padding:.6rem .8rem;margin-bottom:.5rem;}' +
    '@media print{#rules-fab,#rules-backdrop{display:none!important;}}' +
    '@media (max-width:640px){#rules-fab{right:.75rem;bottom:.75rem;padding:.5rem .8rem;}}';

  function buildRules() {
    var R = CFG.rules;
    if (!R) return;

    var style = document.createElement('style');
    style.textContent = RULES_CSS;
    document.head.appendChild(style);

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'rules-fab';
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.innerHTML = 'Rules <span class="ver">v' + esc(R.version) + '</span>';

    var backdrop = document.createElement('div');
    backdrop.id = 'rules-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'rules-title');

    var body = (R.changed ? '<p id="rules-changed"><strong>Changed in v' + esc(R.version) + ':</strong> ' +
                            esc(R.changed) + '</p>' : '') +
      (R.sections || []).map(function (s) {
        return '<h3>' + esc(s.title) + '</h3><ul>' +
               s.items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') +
               '</ul>';
      }).join('') +
      '<p style="margin-top:1.5rem;font-size:.75rem;color:#949cab">' +
        'Need it on paper? The <a href="/smash/rules.html" style="color:var(--accent,#FDB913)">full rules page</a> ' +
        'has a print button.' +
      '</p>';

    backdrop.innerHTML =
      '<div id="rules-card">' +
        '<div id="rules-head">' +
          '<div>' +
            '<p style="font-family:Rajdhani,sans-serif;font-weight:800;font-size:.6875rem;letter-spacing:.22em;' +
              'text-transform:uppercase;color:#949cab;margin:0 0 .25rem">Version ' + esc(R.version) +
              ' &middot; ' + esc(R.updated) + '</p>' +
            '<h2 id="rules-title" style="font-family:Rajdhani,sans-serif;font-weight:900;font-size:1.4rem;text-transform:uppercase;' +
              'font-style:italic;margin:0">Tournament Rules</h2>' +
          '</div>' +
          '<button type="button" id="rules-close" aria-label="Close rules">&times;</button>' +
        '</div>' +
        '<div id="rules-body">' + body + '</div>' +
      '</div>';

    document.body.appendChild(fab);
    document.body.appendChild(backdrop);

    /* While the rules are open, everything behind them is made inert: it
       cannot be tabbed into, clicked, or found by a screen reader, so the
       dialog really is the only thing on the page until it is closed. */
    var behind = [];
    function setBehind(off) {
      if (off) {
        behind = Array.prototype.filter.call(document.body.children, function (el) {
          return el !== backdrop && el.id !== 'feed-announce' && !el.inert && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE';
        });
      }
      behind.forEach(function (el) {
        el.inert = off;
        /* inert is recent; aria-hidden covers screen readers on older browsers */
        if (off) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden');
      });
      if (!off) behind = [];
    }

    function open()  { setBehind(true); backdrop.classList.add('open'); byId('rules-close').focus(); }
    function close() { backdrop.classList.remove('open'); setBehind(false); fab.focus(); }

    fab.addEventListener('click', open);
    byId('rules-close').addEventListener('click', close);
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', function (e) {
      if (!backdrop.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      /* Keep Tab cycling inside the dialog, for browsers without inert. */
      if (e.key === 'Tab') {
        var items = backdrop.querySelectorAll('a[href], button');
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---- when it is --------------------------------------------------------

     Written into whichever pages carry an #event-when, from the one place the
     date lives. A confirmed date becomes a real <time datetime> so it is
     machine-readable; an unconfirmed one is plain text, because "November 7 or
     14" is not a date and should not pretend to be one. Nothing set, nothing
     shown — an empty slot is better than a stale promise.
     ------------------------------------------------------------------------ */

  function paintWhen(host) {
    host = host || byId('event-when');
    if (!host) return;

    if (CFG.eventDate) {
      var d = new Date(CFG.eventDate + 'T00:00:00');
      var label = isNaN(d) ? CFG.eventDate : d.toLocaleDateString(undefined,
        { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      host.innerHTML = '<time datetime="' + esc(CFG.eventDate) + '">' + esc(label) + '</time>' +
                       (CFG.venue ? ' &nbsp;·&nbsp; ' + esc(CFG.venue) : '');
    } else if (CFG.eventNote) {
      host.innerHTML = esc(CFG.eventNote) +
                       (CFG.venue ? ' &nbsp;·&nbsp; ' + esc(CFG.venue) : '');
    } else {
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
  }

  /**
   * Start a bracket page for one division.
   * Paints the division's name and accent into the page, then goes live.
   */
  /** Wires this file to a division. Shared by the bracket page and the display screen. */
  function setup(divisionId) {
    if (!root.SMASH) { console.error('[smash] load data/smash.js first.'); return false; }

    CFG = root.SMASH.config;
    ADVANCE = CFG.advance || 2;
    norm = root.SMASH.norm;

    DIV = CFG.divisions.filter(function (d) { return d.id === divisionId; })[0];
    if (!DIV) { console.error('[smash] unknown division:', divisionId); return false; }

    document.documentElement.style.setProperty('--accent', DIV.accent);
    return true;
  }

  /** Starts the feed and repeats it on the usual interval. */
  function startFeed() {
    refresh();
    setInterval(refresh, Math.max(10, CFG.refreshSeconds || 30) * 1000);

    /* a bracket left up on a projector often sits in a background tab — catch
       it up the moment someone brings it forward */
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) refresh();
    });
  }

  function init(divisionId) {
    if (!setup(divisionId)) return;

    var badge = byId('division-badge');
    if (badge) {
      badge.textContent = DIV.name;
      badge.style.background = DIV.accent;
    }
    var other = CFG.divisions.filter(function (d) { return d.id !== divisionId; })[0];
    var link = byId('other-division');
    if (link && other) {
      link.textContent = other.name + ' →';
      link.setAttribute('href', other.page);
      link.style.borderColor = other.accent;
      link.style.color = other.accent;
    }

    paintWhen();
    buildRules();
    buildFeedControls();
    startFeed();
  }

  root.SMASH_PAGE = {
    init: init,
    onUpdate: onUpdate,
    snapshot: snapshot,
    standings: standings,
    bracket: bracket,
    paintWhen: paintWhen,
    /* shared with the display screen, so both say a result the same way */
    matchSentence: matchSentence,
    setPaused: setPaused
  };

})(window);
