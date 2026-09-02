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

  var EMPTY = { groups: [], groupMatches: [], koMatches: [] };

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

  function fixtureRow(m) {
    var s = root.SMASH.matchScore(m);
    var aWon = s.done && s.a > s.b, bWon = s.done && s.b > s.a;
    var chip = s.done ? s.a + ' – ' + s.b : 'vs';
    return '<div class="fix-wrap"><div class="fix-row">' +
             '<span class="side' + (aWon ? ' won' : '') + '">' + esc(m.teams[0]) + '</span>' +
             '<span class="fix-score' + (s.done ? ' done' : '') + '">' + esc(chip) + '</span>' +
             '<span class="side right' + (bWon ? ' won' : '') + '">' + esc(m.teams[1]) + '</span>' +
           '</div></div>';
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
    if (!d.groups.length) {
      wrap.innerHTML = emptyState('No teams found',
        'Expected group names in row 1 with the teams listed underneath.');
      return;
    }

    wrap.innerHTML = '<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">' +
      d.groups.map(function (g, gi) {
        var rows = standings(gi);
        var complete = groupComplete(gi);
        var ms = d.groupMatches.filter(function (m) { return m.group === g.name; });

        var table = '<table class="grp-table"><thead><tr>' +
          '<th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>Gm</th><th>SD</th><th>Pts</th>' +
          '</tr></thead><tbody>' +
          rows.map(function (r, i) {
            return '<tr class="' + (i < ADVANCE ? 'qualified' : '') + '">' +
              '<td class="pos">' + (i + 1) + '</td>' +
              '<td class="nm">' + esc(r.name) + '</td>' +
              '<td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.l + '</td>' +
              '<td>' + r.gw + '–' + r.gl + '</td>' +
              '<td>' + (r.sd > 0 ? '+' : '') + r.sd + '</td>' +
              '<td class="pts">' + r.pts + '</td></tr>';
          }).join('') + '</tbody></table>';

        return '<div class="bg-esports-card border border-white/5 rounded-2xl p-5">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<h3 class="font-display text-xl font-black uppercase italic">' + esc(g.name) + '</h3>' +
            '<span class="text-[10px] font-display font-bold uppercase tracking-[0.18em] ' +
              (complete ? 'text-esports-yellow-text' : 'text-gray-600') + '">' +
              (complete ? 'Complete' : g.teams.length + ' teams') + '</span>' +
          '</div>' + table +
          '<p class="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-gray-600 mt-5 mb-2">Matches</p>' +
          '<div class="space-y-1.5">' +
            (ms.length ? ms.map(fixtureRow).join('')
                       : '<p class="text-[11px] text-gray-600">No matches listed yet.</p>') +
          '</div></div>';
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

  function bkMatch(m, isFinal) {
    var show = m.done || (m.scoreA + m.scoreB) > 0;
    var h = m.hints || [];
    return '<div class="bk-match' + (isFinal ? ' final-match' : '') + '">' +
           bkTeam(m.teams[0], h[0], show ? m.scoreA : null, m.winner) +
           bkTeam(m.teams[1], h[1], show ? m.scoreB : null, m.winner) +
           '</div>';
  }

  function renderBracket() {
    var wrap = byId('bracket-wrap');
    var note = byId('bracket-note');
    var b = state.data ? bracket() : null;

    if (!b) {
      note.textContent = '';
      wrap.innerHTML = (state.data && DIV.gid)
        ? emptyState('Bracket not started',
            'Rounds appear here as they are filled in on the Elimination Matches rows.')
        : '';
      return;
    }

    note.textContent = 'Bracket teams are entered on the sheet as each round is decided. ' +
      'Empty slots show who the group tables say belongs there.';

    var html = '<div class="bracket">' + b.rounds.map(function (rd, ri) {
      var isLast = ri === b.rounds.length - 1;
      return '<div class="bk-round"><div class="bk-round-title">' + esc(rd.name) + '</div>' +
             '<div class="bk-body">' + rd.matches.map(function (m) {
               return '<div class="bk-slot">' + bkMatch(m, isLast) + '<span class="bk-conn"></span></div>';
             }).join('') + '</div></div>';
    }).join('') + '</div>';

    if (b.third) {
      html += '<div class="mt-4 max-w-[235px]">' +
              '<div class="bk-round-title" style="text-align:left">Third Place</div>' +
              bkMatch(b.third, false) + '</div>';
    }

    var lastRound = b.rounds[b.rounds.length - 1];
    var champ = lastRound && lastRound.matches.length === 1 ? lastRound.matches[0].winner : null;
    if (champ) {
      html = '<div class="glass-panel rounded-2xl p-6 mb-6 border-l-8 border-esports-yellow">' +
             '<p class="text-[10px] font-display font-bold uppercase tracking-[0.25em] text-gray-500 mb-1">Champions</p>' +
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

  function renderStatus() {
    var dot = byId('feed-dot'), txt = byId('feed-text');
    if (!dot || !txt) return;

    if (!root.SMASH.isWired() || !DIV.gid) {
      dot.className = 'feed-dot off'; txt.textContent = 'No sheet connected'; return;
    }
    if (state.error && !state.data) {
      dot.className = 'feed-dot error'; txt.textContent = 'Cannot reach the sheet'; return;
    }
    if (state.error) {
      dot.className = 'feed-dot stale';
      txt.textContent = 'Reconnecting · last update ' + timeOf(state.loadedAt);
      return;
    }
    dot.className = 'feed-dot' + (state.loading ? ' loading' : ' live');
    txt.textContent = state.loadedAt ? 'Live · updated ' + timeOf(state.loadedAt) : 'Loading scores…';
  }

  function renderAll() {
    renderStatus();
    renderWarnings();
    renderGroups();
    renderBracket();
    if (root.lucide && root.lucide.createIcons) root.lucide.createIcons();
  }

  /* ==================================================================
     The feed
     ================================================================== */

  function refresh() {
    if (!root.SMASH.isWired() || !DIV.gid) { renderAll(); return; }
    state.loading = true;
    renderStatus();

    root.SMASH.load().then(function (payload) {
      state.data = payload;
      state.loadedAt = payload.loadedAt;
      state.error = null;
      state.loading = false;
      renderAll();
    }, function (err) {
      /* keep the last good bracket on screen rather than blanking out when
         one request times out on school wifi */
      if (root.console && console.warn) console.warn('[smash] refresh failed:', err.message);
      state.error = err.message;
      state.loading = false;
      renderAll();
    });
  }

  /**
   * Start a bracket page for one division.
   * Paints the division's name and accent into the page, then goes live.
   */
  function init(divisionId) {
    if (!root.SMASH) { console.error('[smash] load data/smash.js first.'); return; }

    CFG = root.SMASH.config;
    ADVANCE = CFG.advance || 2;
    norm = root.SMASH.norm;

    DIV = CFG.divisions.filter(function (d) { return d.id === divisionId; })[0];
    if (!DIV) { console.error('[smash] unknown division:', divisionId); return; }

    document.documentElement.style.setProperty('--accent', DIV.accent);

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

    refresh();
    setInterval(refresh, Math.max(10, CFG.refreshSeconds || 30) * 1000);

    /* a bracket left up on a projector often sits in a background tab — catch
       it up the moment someone brings it forward */
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) refresh();
    });
  }

  root.SMASH_PAGE = { init: init, standings: standings, bracket: bracket };

})(window);
