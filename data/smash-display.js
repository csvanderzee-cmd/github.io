/* ==========================================================================
   PSD Esports — Smash display mode.

   The same two bracket pages, shown the way a tournament needs them: one
   screenful, no scrollbar, readable from the back of the room. Press the
   Display button (or open the page with ?display=1) and this takes over the
   screen; Escape puts it away.

   It shows ONE thing at a time, the group tables or the bracket, and starts
   on whichever the day calls for: the round robin while groups are still
   being played, the bracket once every group game is in the sheet.

   No numbers are worked out here. Everything is handed over by
   data/smash-bracket.js, so the display and the page underneath it can never
   disagree about who is top of a group.
   ========================================================================== */

(function (root) {
  'use strict';

  var CSS =
    '#sd-toggle{display:inline-flex;align-items:center;gap:.45rem;}' +
    '#sd{position:fixed;inset:0;z-index:2000;background:#0B0E14;color:#e5e7eb;display:none;' +
      'flex-direction:column;padding:1.1vmin 1.6vmin;font-family:Inter,sans-serif;}' +
    '#sd.open{display:flex;}' +
    'html.sd-on,body.sd-on{overflow:hidden;}' +

    '#sd .sd-top{display:flex;align-items:center;gap:1.2rem;flex-shrink:0;padding-bottom:.9vmin;' +
      'border-bottom:1px solid rgba(255,255,255,.1);}' +
    '#sd .sd-badge{font-family:Rajdhani,sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:.1em;' +
      'color:#0B0E14;background:var(--accent,#FDB913);padding:.25em .9em;font-size:clamp(.9rem,1.7vmin,1.6rem);' +
      'clip-path:polygon(0 0,100% 0,96% 100%,0% 100%);}' +
    '#sd .sd-view{font-family:Rajdhani,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;' +
      'color:#fff;font-size:clamp(1.1rem,2.6vmin,2.6rem);line-height:1;}' +
    '#sd .sd-right{margin-left:auto;display:flex;align-items:center;gap:1.1rem;font-family:Rajdhani,sans-serif;' +
      'font-weight:700;text-transform:uppercase;letter-spacing:.14em;font-size:clamp(.6rem,1.25vmin,1.1rem);color:#9ca3af;}' +
    '#sd .sd-clock{color:#fff;font-weight:900;letter-spacing:.06em;}' +
    '#sd .sd-dot{width:.9vmin;height:.9vmin;min-width:7px;min-height:7px;border-radius:50%;background:#4b5563;display:inline-block;}' +
    '#sd .sd-dot.live{background:#34d399;}' +
    '#sd .sd-dot.stale,#sd .sd-dot.loading{background:#FDB913;}' +
    '#sd .sd-dot.error{background:#FF6B6B;}' +

    '#sd .sd-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;}' +
    '#sd .sd-fit{flex:0 0 auto;transform-origin:center center;}' +

    '#sd .sd-groups{display:grid;gap:22px;}' +
    '#sd .sd-card{background:#151B26;border:1px solid rgba(255,255,255,.08);border-top:3px solid var(--accent,#FDB913);' +
      'border-radius:14px;padding:16px 18px 12px;}' +
    '#sd .sd-ghead{display:flex;align-items:baseline;gap:.6rem;margin-bottom:10px;}' +
    '#sd .sd-gname{font-family:Rajdhani,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;' +
      'font-size:1.5rem;color:#fff;line-height:1;}' +
    '#sd .sd-gtag{margin-left:auto;font-family:Rajdhani,sans-serif;font-weight:700;font-size:.72rem;' +
      'letter-spacing:.18em;text-transform:uppercase;color:#949cab;}' +
    '#sd .sd-gtag.done{color:#FFD166;}' +
    '#sd table{width:100%;border-collapse:collapse;}' +
    '#sd th{font-family:Rajdhani,sans-serif;font-weight:700;font-size:.72rem;letter-spacing:.16em;' +
      'text-transform:uppercase;color:#949cab;text-align:right;padding:0 4px 6px;}' +
    '#sd th:first-child,#sd td:first-child,#sd th:nth-child(2),#sd td:nth-child(2){text-align:left;}' +
    '#sd td{padding:7px 4px;text-align:right;border-top:1px solid rgba(255,255,255,.07);color:#d1d5db;' +
      'font-variant-numeric:tabular-nums;font-size:1.15rem;}' +
    '#sd tr.q td{background:linear-gradient(90deg,rgba(253,185,19,.1),transparent);}' +
    '#sd tr.q td:first-child{box-shadow:inset 3px 0 0 #FDB913;}' +
    '#sd .sd-pos{color:#8f97a5;width:2rem;}' +
    '#sd .sd-nm{color:#fff;font-weight:700;}' +
    '#sd .sd-pts{color:#fff;font-weight:800;}' +

    '#sd .sd-bracket{display:flex;align-items:stretch;justify-content:center;}' +
    '#sd .sd-round{flex:0 0 300px;display:flex;flex-direction:column;margin-right:4rem;}' +
    '#sd .sd-round:last-child{margin-right:0;}' +
    '#sd .sd-rtitle{font-family:Rajdhani,sans-serif;font-weight:800;font-size:.85rem;letter-spacing:.22em;' +
      'text-transform:uppercase;color:#949cab;text-align:center;padding-bottom:14px;}' +
    '#sd .sd-rbody{flex:1;display:flex;flex-direction:column;}' +
    '#sd .sd-slot{flex:1;display:flex;align-items:center;position:relative;min-height:96px;}' +
    '#sd .sd-round:not(:last-child) .sd-slot::after,#sd .sd-round:not(:first-child) .sd-slot::before{' +
      'content:"";position:absolute;top:50%;width:2rem;height:2px;background:rgba(255,255,255,.14);}' +
    '#sd .sd-round:not(:last-child) .sd-slot::after{left:100%;}' +
    '#sd .sd-round:not(:first-child) .sd-slot::before{right:100%;}' +
    '#sd .sd-conn{position:absolute;left:calc(100% + 2rem);top:50%;width:2px;height:100%;' +
      'background:rgba(255,255,255,.14);display:none;}' +
    '#sd .sd-round:not(:last-child) .sd-slot:nth-child(odd) .sd-conn{display:block;}' +
    '#sd .sd-match{width:100%;background:#151B26;border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden;}' +
    '#sd .sd-team{display:flex;align-items:center;gap:.6rem;padding:9px 12px;font-size:1.1rem;color:#9ca3af;}' +
    '#sd .sd-team + .sd-team{border-top:1px solid rgba(255,255,255,.07);}' +
    '#sd .sd-team .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#sd .sd-team .s{font-family:Rajdhani,sans-serif;font-weight:900;color:#8f97a5;font-variant-numeric:tabular-nums;font-size:1.25rem;}' +
    '#sd .sd-team.won{color:#fff;font-weight:800;background:rgba(253,185,19,.08);}' +
    '#sd .sd-team.won .s{color:#FFD166;}' +
    '#sd .sd-team.tbd{color:#8f97a5;font-style:italic;}' +
    '#sd .sd-match.final{border-color:rgba(253,185,19,.5);box-shadow:0 0 30px rgba(253,185,19,.15);}' +
    '#sd .sd-third{margin-top:26px;text-align:center;}' +
    '#sd .sd-third-label,#sd .sd-champ-label{font-family:Rajdhani,sans-serif;font-weight:800;font-size:.8rem;' +
      'letter-spacing:.22em;text-transform:uppercase;color:#949cab;margin-bottom:10px;}' +
    '#sd .sd-third .sd-match{max-width:300px;margin:0 auto;}' +
    '#sd .sd-champ{text-align:center;margin-top:26px;}' +
    '#sd .sd-champ-label{color:#FFD166;letter-spacing:.26em;}' +
    '#sd .sd-champ-name{font-family:Rajdhani,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;' +
      'font-size:3rem;color:#fff;line-height:1.1;}' +

    '#sd .sd-wait{text-align:center;padding:80px 0;width:900px;}' +
    '#sd .sd-wait h2{font-family:Rajdhani,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;' +
      'font-size:2.6rem;color:#fff;margin:0 0 12px;}' +
    '#sd .sd-wait p{color:#949cab;font-size:1.2rem;margin:0;}' +

    '#sd .sd-bottom{flex-shrink:0;display:flex;align-items:center;gap:1rem;padding-top:.9vmin;' +
      'border-top:1px solid rgba(255,255,255,.1);font-family:Rajdhani,sans-serif;font-weight:700;' +
      'text-transform:uppercase;letter-spacing:.16em;font-size:clamp(.6rem,1.25vmin,1.05rem);color:#949cab;}' +
    '#sd .sd-switch{margin-left:auto;display:flex;gap:.5rem;}' +
    '#sd .sd-switch button{font:inherit;letter-spacing:.14em;color:#9ca3af;cursor:pointer;' +
      'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:9999px;' +
      'padding:.45em 1.3em;transition:all .15s;}' +
    '#sd .sd-switch button:hover{color:#fff;background:rgba(255,255,255,.1);}' +
    '#sd .sd-switch button[aria-pressed="true"]{color:#0B0E14;background:var(--accent,#FDB913);border-color:var(--accent,#FDB913);}' +
    '#sd .sd-switch button:focus-visible{outline:3px solid #FFD166;outline-offset:2px;}' +
    '#sd .sd-hint{color:#8f97a5;}' +
    '@media (max-width:700px){#sd .sd-hint{display:none;}}' +
    /* read by screen readers, not drawn; headings keep their display styling */
    '#sd .sd-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}' +
    '#sd h2.sd-view,#sd h3.sd-gname,#sd h3.sd-rtitle,#sd h3.sd-third-label{margin:0;}' +
    '@media print{#sd{display:none!important;}}';

  var MAX_SCALE = 2.4;
  var COL_W = 460, COL_GAP = 22;

  var el = {};          // the display's own elements
  var snap = null;      // last snapshot from the bracket script
  var view = 'auto';    // auto | groups | bracket
  var pinned = false;   // true once someone picks a view by hand
  var open = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Screen-reader text. The screen is drawn for the back of the room, but it
     is still a page someone may open with a screen reader, so every table and
     match says in words what the colours and bold say on screen — in the same
     sentences as the bracket page underneath. */
  function sr(text) { return '<span class="sd-sr">' + esc(text) + '</span>'; }

  var COLUMNS = [['#', 'Position'], ['Team', 'Team'], ['P', 'Played'], ['W', 'Won'], ['L', 'Lost'],
                 ['SD', 'Stock differential'], ['Pts', 'Points']];

  function columnHead(c) {
    return c[0] === c[1]
      ? '<th scope="col">' + esc(c[0]) + '</th>'
      : '<th scope="col" title="' + esc(c[1]) + '"><span aria-hidden="true">' + esc(c[0]) + '</span>' + sr(c[1]) + '</th>';
  }

  /* ---- markup ---------------------------------------------------------- */

  function waiting(title, body) {
    return '<div class="sd-wait"><h2>' + esc(title) + '</h2><p>' + esc(body) + '</p></div>';
  }

  function groupsHtml(s, cols) {
    if (!s.groups.length) {
      return { html: waiting('Groups not posted yet', 'They appear here as soon as the draw is in the sheet.'),
               width: '900px' };
    }
    var cards = s.groups.map(function (g) {
      var rows = g.rows.map(function (r, i) {
        var place = i < s.advance ? sr(g.complete ? ', qualified' : ', currently in a qualifying place') : '';
        return '<tr class="' + (i < s.advance ? 'q' : '') + '">' +
          '<td class="sd-pos">' + (i + 1) + '</td>' +
          '<td class="sd-nm">' + esc(r.name) + place + '</td>' +
          '<td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.l + '</td>' +
          '<td>' + (r.sd > 0 ? '+' : '') + r.sd + '</td>' +
          '<td class="sd-pts">' + r.pts + '</td></tr>';
      }).join('');
      return '<div class="sd-card">' +
        '<div class="sd-ghead"><h3 class="sd-gname">' + esc(g.name) + '</h3>' +
          '<span class="sd-gtag' + (g.complete ? ' done' : '') + '">' +
            (g.complete ? 'Complete' : g.rows.length + ' teams') + '</span></div>' +
        '<table><caption class="sd-sr">' + esc(g.name) + ' standings. Top ' + s.advance + ' advance.</caption>' +
        '<thead><tr>' + COLUMNS.map(columnHead).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }).join('');

    return {
      html: '<div class="sd-groups" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' +
            cards + '</div>',
      width: (cols * COL_W + (cols - 1) * COL_GAP) + 'px'
    };
  }

  function teamRow(name, hint, score, winner) {
    var known = name && name !== '';
    var won = known && winner && winner === name;
    return '<div class="sd-team' + (won ? ' won' : '') + (known ? '' : ' tbd') + '">' +
      '<span class="t">' + esc(known ? name : (hint || 'TBD')) + '</span>' +
      '<span class="s">' + (score === null || score === undefined ? '' : score) + '</span></div>';
  }

  function matchHtml(m, isFinal, label) {
    var show = m.done || (m.scoreA + m.scoreB) > 0;
    var h = m.hints || [];
    var say = root.SMASH_PAGE.matchSentence(m.teams[0] || h[0] || '', m.teams[1] || h[1] || '',
                                            { a: m.scoreA, b: m.scoreB, done: m.done });
    return '<div class="sd-match' + (isFinal ? ' final' : '') + '" role="group" aria-label="' + esc(label) + '">' +
      sr(say) + '<div aria-hidden="true">' +
      teamRow(m.teams[0], h[0], show ? m.scoreA : null, m.winner) +
      teamRow(m.teams[1], h[1], show ? m.scoreB : null, m.winner) +
      '</div></div>';
  }

  function bracketHtml(s) {
    var b = s.bracket;
    if (!b || !b.rounds.length) {
      return waiting('Bracket not drawn yet', 'The knockout rounds appear here once the groups are done.');
    }
    var html = '<div class="sd-bracket">' + b.rounds.map(function (rd, ri) {
      var isLast = ri === b.rounds.length - 1;
      var one = rd.matches.length === 1;
      return '<section class="sd-round" aria-labelledby="sd-round-' + ri + '">' +
        '<h3 class="sd-rtitle" id="sd-round-' + ri + '">' + esc(rd.name) + '</h3><div class="sd-rbody">' +
        rd.matches.map(function (m, mi) {
          return '<div class="sd-slot">' + matchHtml(m, isLast, one ? rd.name : rd.name + ', match ' + (mi + 1)) +
                 '<span class="sd-conn" aria-hidden="true"></span></div>';
        }).join('') + '</div></section>';
    }).join('') + '</div>';

    if (b.third) {
      html += '<section class="sd-third" aria-labelledby="sd-third"><h3 class="sd-third-label" id="sd-third">Third Place</h3>' +
              matchHtml(b.third, false, 'Third place match') + '</section>';
    }

    /* Once the final is decided the champion is the thing worth reading from
       the back of the room, so it gets its own line under the ladder. */
    var lastRound = b.rounds[b.rounds.length - 1];
    var fin = lastRound && lastRound.matches.length === 1 ? lastRound.matches[0] : null;
    if (fin && fin.done && fin.winner) {
      html += '<div class="sd-champ"><div class="sd-champ-label">Champions</div>' +
              '<div class="sd-champ-name">' + esc(fin.winner) + '</div></div>';
    }
    return html;
  }

  /* ---- fitting ----------------------------------------------------------

     Content is drawn at its natural size and then scaled until it fills the
     screen in whichever direction runs out first, so a sparse bracket grows
     and twelve group tables shrink. Nothing is cut off, nothing scrolls.
     ----------------------------------------------------------------------- */

  function scaleToFit() {
    var stage = el.stage, fit = el.fit;
    fit.style.transform = 'scale(1)';
    var w = fit.scrollWidth, h = fit.scrollHeight;
    if (!w || !h) return;
    var scale = Math.min(stage.clientWidth / w, stage.clientHeight / h, MAX_SCALE);
    fit.style.transform = 'scale(' + scale + ')';
  }

  /* How many columns the groups go in is decided by trying them: a wide
     screen reads four groups best in one row, a squarer one in two rows of
     two. Whichever arrangement ends up largest on this screen wins. */
  function drawGroups(s) {
    var n = s.groups.length || 1;
    var best = null;

    for (var cols = 1; cols <= Math.min(n, 4); cols++) {
      var g = groupsHtml(s, cols);
      el.fit.style.width = g.width;
      el.fit.innerHTML = g.html;
      el.fit.style.transform = 'scale(1)';
      var w = el.fit.scrollWidth, h = el.fit.scrollHeight;
      if (!w || !h) continue;
      var scale = Math.min(el.stage.clientWidth / w, el.stage.clientHeight / h, MAX_SCALE);
      if (!best || scale > best.scale) best = { scale: scale, html: g.html, width: g.width };
    }

    if (!best) { scaleToFit(); return; }
    el.fit.style.width = best.width;
    el.fit.innerHTML = best.html;
    el.fit.style.transform = 'scale(' + best.scale + ')';
  }

  /* ---- painting ---------------------------------------------------------- */

  function render() {
    if (!open || !snap) return;

    /* "auto" follows the tournament: the round robin while groups are being
       played, the bracket once every group game is in. Picking a view by hand
       pins it, so a screen somebody set on purpose stays put. */
    if (!pinned) view = snap.groupsComplete && snap.bracket ? 'bracket' : 'groups';
    var showing = view === 'bracket' ? 'bracket' : 'groups';

    el.badge.textContent = (root.SMASH && root.SMASH.testMode ? 'TEST DATA · ' : '') + snap.division.name;
    el.badge.style.background = snap.division.accent;
    el.view.textContent = showing === 'bracket' ? 'Elimination Bracket' : 'Group Stage';
    el.legend.textContent = showing === 'bracket'
      ? 'Single elimination · Best of 3'
      : 'Round robin · Win = 3 points · Top ' + snap.advance + ' advance';

    el.btnGroups.setAttribute('aria-pressed', String(showing === 'groups'));
    el.btnBracket.setAttribute('aria-pressed', String(showing === 'bracket'));
    el.btnPause.setAttribute('aria-pressed', String(!!snap.paused));
    el.btnPause.textContent = snap.paused ? 'Resume updates' : 'Pause updates';

    if (!snap.wired)                        { el.dot.className = 'sd-dot';         el.feed.textContent = 'No sheet'; }
    else if (snap.paused)                   { el.dot.className = 'sd-dot';         el.feed.textContent = 'Paused'; }
    else if (snap.error && !snap.hasData)   { el.dot.className = 'sd-dot error';   el.feed.textContent = 'No connection'; }
    else if (snap.error)                    { el.dot.className = 'sd-dot stale';   el.feed.textContent = 'Reconnecting'; }
    else if (snap.loading && !snap.hasData) { el.dot.className = 'sd-dot loading'; el.feed.textContent = 'Loading'; }
    else                                    { el.dot.className = 'sd-dot live';    el.feed.textContent = 'Live'; }

    if (showing === 'bracket') {
      el.fit.style.width = 'max-content';
      el.fit.innerHTML = bracketHtml(snap);
      scaleToFit();
    } else {
      drawGroups(snap);
    }
  }

  /* ---- the screen itself -------------------------------------------------- */

  function build() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var sd = document.createElement('div');
    sd.id = 'sd';
    /* It covers the whole page, so it is a modal dialog: named by its title,
       and the page underneath made inert while it is up (see show()). */
    sd.setAttribute('role', 'dialog');
    sd.setAttribute('aria-modal', 'true');
    sd.setAttribute('aria-labelledby', 'sd-badge sd-view');
    sd.innerHTML =
      '<div class="sd-top">' +
        '<span class="sd-badge" id="sd-badge"></span>' +
        '<h2 class="sd-view" id="sd-view">Tournament display</h2>' +
        '<div class="sd-right">' +
          '<span id="sd-where"></span>' +
          '<span><span class="sd-dot" id="sd-dot"></span> <span id="sd-feed">Loading</span></span>' +
          '<span class="sd-clock" id="sd-clock"></span>' +
        '</div>' +
      '</div>' +
      '<div class="sd-stage" id="sd-stage"><div class="sd-fit" id="sd-fit"></div></div>' +
      '<div class="sd-bottom">' +
        '<span id="sd-legend"></span>' +
        '<span class="sd-hint">&larr; &rarr; or space switches &middot; Esc closes</span>' +
        '<div class="sd-switch">' +
          '<button type="button" id="sd-groups" aria-pressed="true">Round Robin</button>' +
          '<button type="button" id="sd-bracket" aria-pressed="false">Bracket</button>' +
          /* WCAG 2.2.2: the scores update on their own, so they can be held still */
          '<button type="button" id="sd-pause" aria-pressed="false">Pause updates</button>' +
          '<button type="button" id="sd-exit">Exit</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(sd);

    el = {
      root: sd,
      badge: sd.querySelector('#sd-badge'),
      view: sd.querySelector('#sd-view'),
      where: sd.querySelector('#sd-where'),
      dot: sd.querySelector('#sd-dot'),
      feed: sd.querySelector('#sd-feed'),
      clock: sd.querySelector('#sd-clock'),
      stage: sd.querySelector('#sd-stage'),
      fit: sd.querySelector('#sd-fit'),
      legend: sd.querySelector('#sd-legend'),
      btnGroups: sd.querySelector('#sd-groups'),
      btnBracket: sd.querySelector('#sd-bracket'),
      btnPause: sd.querySelector('#sd-pause'),
      btnExit: sd.querySelector('#sd-exit')
    };

    el.btnGroups.addEventListener('click', function () { pick('groups'); });
    el.btnBracket.addEventListener('click', function () { pick('bracket'); });
    el.btnPause.addEventListener('click', function () {
      root.SMASH_PAGE.setPaused(!(snap && snap.paused));
    });
    el.btnExit.addEventListener('click', function () { close(); });

    var c = root.SMASH && root.SMASH.config;
    if (c) el.where.textContent = [c.venue, c.startTime].filter(Boolean).join(' · ');

    tick();
    setInterval(tick, 20000);
    window.addEventListener('resize', render);
  }

  function tick() {
    if (root.PSD_NAV && PSD_NAV.still && PSD_NAV.still()) return;   // held by the pause-animations switch
    if (el.clock) el.clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function pick(which) {
    pinned = true;
    view = which;
    render();
    writeUrl();
  }

  /* The address carries the state, so a screen set up on the day can be
     bookmarked, or reopened after a reboot, exactly as it was. */
  function writeUrl() {
    if (!root.history || !history.replaceState) return;
    var u = new URL(location.href);
    if (open) {
      u.searchParams.set('display', '1');
      if (pinned) u.searchParams.set('view', view); else u.searchParams.delete('view');
    } else {
      u.searchParams.delete('display');
      u.searchParams.delete('view');
    }
    history.replaceState(null, '', u.toString());
  }

  /* While the display is up, the page under it is inert: it cannot be tabbed
     into or found by a screen reader, so keyboard focus stays on the screen
     that is actually showing. The live announcer stays outside, so score
     updates are still spoken. */
  var behind = [];
  function setBehind(off) {
    if (off) {
      behind = Array.prototype.filter.call(document.body.children, function (n) {
        return n !== el.root && n.id !== 'feed-announce' && !n.inert && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE';
      });
    }
    behind.forEach(function (n) {
      n.inert = off;
      if (off) n.setAttribute('aria-hidden', 'true'); else n.removeAttribute('aria-hidden');
    });
    if (!off) behind = [];
  }

  function show() {
    if (open) return;
    open = true;
    el.root.classList.add('open');
    document.documentElement.classList.add('sd-on');
    document.body.classList.add('sd-on');
    if (el.toggle) el.toggle.setAttribute('aria-expanded', 'true');
    setBehind(true);
    render();
    writeUrl();
    el.btnExit.focus();
  }

  function close() {
    open = false;
    el.root.classList.remove('open');
    document.documentElement.classList.remove('sd-on');
    document.body.classList.remove('sd-on');
    setBehind(false);
    if (el.toggle) { el.toggle.setAttribute('aria-expanded', 'false'); el.toggle.focus(); }
    writeUrl();
  }

  /** Adds the button that opens display mode, next to the other-division link. */
  function addButton() {
    var anchor = document.getElementById('other-division');
    var host = anchor ? anchor.parentNode : null;
    if (!host) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'sd-toggle';
    btn.className = 'div-tab no-print';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span aria-hidden="true">🖵</span> Display screen';
    btn.addEventListener('click', show);
    host.insertBefore(btn, anchor.nextSibling);
    el.toggle = btn;
  }

  /**
   * Wire display mode into a bracket page. Call after SMASH_PAGE.init().
   */
  function init() {
    if (!root.SMASH_PAGE || !root.SMASH_PAGE.onUpdate) {
      if (root.console) console.error('[smash] load data/smash-bracket.js first.');
      return;
    }

    build();
    addButton();

    var params = new URLSearchParams(location.search);
    var wanted = params.get('view');
    if (wanted === 'groups' || wanted === 'bracket') { view = wanted; pinned = true; }

    root.SMASH_PAGE.onUpdate(function (s) { snap = s; render(); });

    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      /* Space on a focused button presses that button, as everywhere else;
         only Space with no button focused switches the view. */
      var onButton = e.target && e.target.tagName === 'BUTTON';
      if ((e.key === ' ' || e.key === 'Spacebar') && onButton) return;
      /* Tab stays on the display screen, for browsers without inert. */
      if (e.key === 'Tab') {
        var items = el.root.querySelectorAll('button');
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        pick(view === 'bracket' ? 'groups' : 'bracket');
      }
    });

    /* Wait for the page to finish building — the site nav is added on
       DOMContentLoaded — so everything under the display is made inert. */
    if (params.get('display') === '1') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
      else show();
    }
  }

  root.SMASH_DISPLAY = { init: init, show: show, close: close };

})(window);
