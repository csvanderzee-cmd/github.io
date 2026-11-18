/* ==========================================================================
   Championship bracket — one division per page.

   The page names its division on <body data-league="pl|jrpl">; everything
   else (sheet, tab, times, school logos) comes from data/leagues.js. Load
   leagues.js and psd-data.js first.

   Display screen (the button in the header, or ?display=1): for the big
   screen in the arena. The site nav goes, the page stops scrolling, the
   bracket is scaled to fill the screen, and a clock shows. The controls fade
   when nobody is using them; Escape or Exit puts the page back.

   ?stream is the same screen for the livestream, with no controls at all.
   ========================================================================== */

(function () {
  'use strict';

  const LEAGUE_ID = document.body.dataset.league;
  const lg = PSD.config.league(LEAGUE_ID);
  const DESIGN_W = 1640;   // must match .stage width in finals-bracket.css
  const PHONE_MAX = 899;   // must match the phone media query

  const params = new URLSearchParams(location.search);
  const STREAM = params.has('stream');
  if (STREAM) document.body.classList.add('stream', 'display');

  /* ---- helpers ----------------------------------------------------------- */

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  // Strips the side off "Shadow Hills ORANGE". A/B is last season's naming and
  // stays recognised so an archived bracket still reads.
  const schoolOf = n => (n || '').replace(/\s+(ORANGE|BLUE|[AB])$/i, '').trim();
  const toNum    = v => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };
  const cleanTB  = v => { const s = (v || '').trim(); return (s.toLowerCase() === 'tiebreaker' || s === '') ? '' : s; };

  function logoHtml(name) {
    const url = PSD.config.schoolLogo(name);
    const init = name.replace(/\s+[AB]$/i, '').split(/\s+/).map(w => w[0]).join('').substring(0, 3).toUpperCase();
    return url
      ? `<img src="${esc(url)}" alt="" class="logo-sm" onerror="this.style.display='none'">`
      : `<div class="logo-fb-sm" aria-hidden="true">${esc(init)}</div>`;
  }

  /* ---- reading the bracket tab --------------------------------------------

     Each match is a block found by its label in column A, so rows can move:

       Semifinal 1 ...      | School | Game 1 ... Game 5     <- label row
       Blue                 | school 1  | goals per game
       Blue                 | school 2  |
       Orange               | school 1  |
       Orange               | school 2  |
       Tiebreaker           | school 1  | goals (Game 1 column)
       Tiebreaker           | school 2  |

     Labels: "Semifinal 1", "Semifinal 2", "Championship Final", "Third Place".
     Labels and names go in columns A and B, goals in C to G.
     ------------------------------------------------------------------------ */

  const GAMES = 5, TO_WIN = 3;   // best of 5

  /* Read the same way as the Smash brackets: the tab's CSV export, every 30
     seconds. It is live (seconds behind the sheet, not the minutes the
     publish-to-web copy can lag) and, unlike the gviz feed, it returns every
     cell exactly as typed: gviz guesses a type per column and blanks text in a
     column of numbers, so an "F" forfeit or a "3-1" would vanish. Needs the
     workbook shared as anyone with the link, Viewer. If the export cannot be
     reached, the shared feed (PSD.fetchCSV) is the fallback. */
  const TIMEOUT_MS = 9000;

  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell.trim()); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell.trim()); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
    return rows;
  }

  async function fetchRows() {
    if (lg.finalsFastId) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const url = 'https://docs.google.com/spreadsheets/d/' + lg.finalsFastId +
                    '/export?format=csv&gid=' + lg.finalsGid + '&_=' + Date.now();
        const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
        if (!res.ok) throw new Error('finals tab: HTTP ' + res.status);
        return parseCSV(await res.text());
      } catch (e) {
        console.warn('[finals] export feed failed, using the shared feed:', e.message);
      } finally {
        clearTimeout(timer);
      }
    }
    return parseCSV(await PSD.fetchCSV(lg.matchSheet, lg.finalsGid));
  }

  function parseSheet(rows) {
    const g = (r, c) => (rows[r] && rows[r][c]) || '';
    const find = re => rows.findIndex(row => re.test((row[0] || '').trim()));
    const team = r => ({ name: g(r, 1), sc: Array.from({ length: GAMES }, (_, k) => g(r, 2 + k)) });
    const block = r => r < 0 ? null : {
      school1: schoolOf(g(r + 1, 1)),
      school2: schoolOf(g(r + 2, 1)),
      a: { t1: team(r + 1), t2: team(r + 2) },   // BLUE, played first
      b: { t1: team(r + 3), t2: team(r + 4) },   // ORANGE
      tb1: cleanTB(g(r + 5, 2)), tb2: cleanTB(g(r + 6, 2))
    };
    const d = {
      s1: block(find(/^semi[- ]?final\s*1\b/i)),
      s2: block(find(/^semi[- ]?final\s*2\b/i)),
      fin: block(find(/^(championship\s+)?final\b/i)),
      third: block(find(/^third\b|^3rd\b/i))
    };
    return d.s1 && d.s2 && d.fin ? d : null;
  }

  /* ---- scoring ----------------------------------------------------------- */

  function calcMatch(t1, t2) {
    let w1 = 0, w2 = 0, gp = 0;
    const games = t1.sc.map((v1, i) => {
      const n1 = toNum(v1), n2 = toNum(t2.sc[i]);
      if (n1 === null || n2 === null) return null;
      gp++;
      if (n1 > n2) { w1++; return { n1, n2, gw: 1 }; }
      if (n2 > n1) { w2++; return { n1, n2, gw: 2 }; }
      return { n1, n2, gw: 0 };
    });
    const winner = w1 >= TO_WIN ? 1 : w2 >= TO_WIN ? 2 : 0;
    return { w1, w2, gp, games, winner };
  }

  /** A school takes a series by winning both its BLUE and ORANGE matches, or the tiebreaker on a split. */
  function solveMatchup(s1, s2, aRes, bRes, tb1, tb2) {
    const aWin = aRes.winner === 1 ? s1 : aRes.winner === 2 ? s2 : null;
    const bWin = bRes.winner === 1 ? s1 : bRes.winner === 2 ? s2 : null;
    if (!aWin || !bWin) return { winner: null, isSplit: false, needsTB: false, aWin, bWin, tbN1: null, tbN2: null };
    if (aWin === bWin)  return { winner: aWin, isSplit: false, needsTB: false, aWin, bWin, tbN1: null, tbN2: null };

    let tbWinner = null, tbN1 = null, tbN2 = null;
    const n1 = toNum(tb1), n2 = toNum(tb2);
    if (n1 !== null && n2 !== null) {
      tbN1 = n1; tbN2 = n2;
      if (n1 !== n2) tbWinner = n1 > n2 ? s1 : s2;
    } else if (tb1 && !tb2) {
      // A single cell like "3-1", or the winning school's name typed in.
      const parts = tb1.split('-').map(p => p.trim());
      if (parts.length === 2) {
        const p1 = toNum(parts[0]), p2 = toNum(parts[1]);
        if (p1 !== null && p2 !== null) {
          tbN1 = p1; tbN2 = p2;
          if (p1 !== p2) tbWinner = p1 > p2 ? s1 : s2;
        }
      }
      if (!tbWinner) {
        const t = tb1.toLowerCase();
        if (s1 && t.includes(s1.toLowerCase())) tbWinner = s1;
        else if (s2 && t.includes(s2.toLowerCase())) tbWinner = s2;
      }
    }
    return { winner: tbWinner, isSplit: true, needsTB: !tbWinner, aWin, bWin, tbN1, tbN2 };
  }

  /* ---- rendering --------------------------------------------------------- */

  function teamRow(team, series, gamesKey, rankCls) {
    const { games, winner, gp } = series;
    const me = gamesKey === 'n1' ? 1 : 2;
    const isWin = winner === me, isLoss = winner && winner !== me;
    const isTbd = !team.name;
    const pills = games.filter(Boolean).map(g =>
      `<span class="gpill${g.gw === me ? ' gw' : ''}">${g[gamesKey]}</span>`).join('');
    const wins = me === 1 ? series.w1 : series.w2;
    return `<div class="competitor ${isWin ? 'win' : isLoss ? 'loss' : isTbd ? 'tbd' : ''} ${rankCls}">
      ${isTbd ? '' : logoHtml(team.name)}
      <span class="comp-name${isTbd ? ' tbd' : ''}">${isTbd ? 'TBD' : esc(schoolOf(team.name))}</span>
      ${isWin ? '<span class="crown" role="img" aria-label="winner">👑</span>' : ''}
      ${pills ? `<span class="gscores" role="group" aria-label="game scores">${pills}</span>` : ''}
      <span class="score-disp ${isWin ? 'win' : isLoss ? 'loss' : gp ? 'none' : ''}">${gp ? wins : ''}</span>
    </div>`;
  }

  function seriesHtml(t1, t2, res, side, higherCls, lowerCls) {
    const winName = res.winner === 1 ? schoolOf(t1.name) : res.winner === 2 ? schoolOf(t2.name) : '';
    return `<div class="sub-section">
      <div class="sub-bar">
        <span class="sub-bar-label ${side.toLowerCase()}">${side} Team</span>
        ${winName ? `<span class="sub-result-pill w">${esc(winName)}</span>` : ''}
      </div>
      ${teamRow(t1, res, 'n1', higherCls)}
      ${teamRow(t2, res, 'n2', lowerCls)}
    </div>`;
  }

  const CLOCK = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

  function cardHtml(m, label, seed1, seed2, kind, startTime, t1IsHigher) {
    const isChamp = kind === 'final', isThird = kind === 'third';
    t1IsHigher = t1IsHigher !== false;
    const higherCls = t1IsHigher ? 't1-team' : 't2-team';
    const lowerCls  = t1IsHigher ? 't2-team' : 't1-team';
    const s1 = m.school1 || (isChamp ? 'Winner Semi 1' : isThird ? 'Loser Semi 1' : `Seed ${seed1}`);
    const s2 = m.school2 || (isChamp ? 'Winner Semi 2' : isThird ? 'Loser Semi 2' : `Seed ${seed2}`);

    const aRes = calcMatch(m.a.t1, m.a.t2);
    const bRes = calcMatch(m.b.t1, m.b.t2);
    const r = solveMatchup(s1, s2, aRes, bRes, m.tb1, m.tb2);
    const hasTBData = r.tbN1 !== null || r.tbN2 !== null || m.tb1;

    const tbRow = (name, n, cls) => `<div class="competitor ${cls} ${r.winner === name ? 'win' : r.winner ? 'loss' : ''}">
        ${logoHtml(name)}<span class="comp-name">${esc(name)}</span>
        ${r.winner === name ? '<span class="crown" role="img" aria-label="winner">👑</span>' : ''}
        ${n !== null ? `<span class="score-disp ${r.winner === name ? 'win' : r.winner ? 'loss' : 'none'}">${n}</span>` : ''}
      </div>`;
    const tb = r.isSplit ? `<div class="sub-section tb-section">
        <div class="sub-bar">
          <span class="sub-bar-label">🔥 School Tiebreaker</span>
          ${r.winner ? `<span class="sub-result-pill w">${esc(r.winner)} wins</span>` : hasTBData ? '<span class="sub-result-pill pending">Deciding…</span>' : ''}
        </div>
        ${tbRow(s1, r.tbN1, higherCls)}${tbRow(s2, r.tbN2, lowerCls)}
      </div>` : '';

    let barCls = 'waiting', barTxt = '⏳ Awaiting results';
    if (r.winner)                    { barCls = isChamp ? 'champ' : 'advance'; barTxt = isChamp ? `👑 ${esc(r.winner)}: Champions!` : isThird ? `🥉 ${esc(r.winner)} takes third` : `🏆 ${esc(r.winner)} advances`; }
    else if (r.needsTB && hasTBData) { barCls = 'tb-needed'; barTxt = '🔥 Tiebreaker: score incomplete'; }
    else if (r.needsTB)              { barCls = 'tb-needed'; barTxt = '🔥 Tiebreaker needed'; }
    else if (r.aWin || r.bWin)       { barTxt = `⏳ Waiting for ${!r.aWin ? 'BLUE' : 'ORANGE'} Team result`; }
    else if (aRes.gp || bRes.gp)     { barTxt = '⏳ In progress'; }

    const seedBadge = s => s ? `<span class="sb s${s}">#${s}</span>` : '';
    const nameCls = hi => (hi === t1IsHigher) ? 't1-name' : 't2-name';

    return `<div class="matchup-card${isChamp ? ' champ-card' : isThird ? ' third-card' : ''}">
      <div class="matchup-hdr">
        <span class="matchup-hdr-title">${label}</span>
        ${startTime ? `<span class="matchup-start-time">${CLOCK}${esc(startTime)}</span>` : ''}
        <div class="matchup-vs">
          <div class="matchup-team-row">${seedBadge(seed1)}${m.school1 ? logoHtml(s1) : ''}<span class="matchup-school-name ${nameCls(true)}" title="${esc(s1)}">${esc(s1)}</span></div>
          <span class="vs-sep">VS</span>
          <div class="matchup-team-row">${seedBadge(seed2)}${m.school2 ? logoHtml(s2) : ''}<span class="matchup-school-name ${nameCls(false)}" title="${esc(s2)}">${esc(s2)}</span></div>
        </div>
      </div>
      ${seriesHtml(m.a.t1, m.a.t2, aRes, 'BLUE', higherCls, lowerCls)}
      ${seriesHtml(m.b.t1, m.b.t2, bRes, 'ORANGE', higherCls, lowerCls)}
      ${tb}
      <div class="result-bar ${barCls}">${barTxt}</div>
    </div>`;
  }

  function render(d) {
    const times = lg.finalsTimes || {};
    // Semi 1 is #1 v #4 and Semi 2 is #2 v #3, so a finalist's seed is traced back through the semis.
    const seedOf = s => !s ? 99 : s === d.s1.school1 ? 1 : s === d.s1.school2 ? 4 : s === d.s2.school1 ? 2 : s === d.s2.school2 ? 3 : 99;
    const finT1IsHigher = seedOf(d.fin.school1) <= seedOf(d.fin.school2);

    const finA = calcMatch(d.fin.a.t1, d.fin.a.t2), finB = calcMatch(d.fin.b.t1, d.fin.b.t2);
    const champion = solveMatchup(d.fin.school1, d.fin.school2, finA, finB, d.fin.tb1, d.fin.tb2).winner;

    const s1Card = `<div class="semi-col left-semi">${cardHtml(d.s1, 'Semifinal 1 · #1 vs #4', 1, 4, 'semi', times.s1)}</div>`;
    const s2Card = `<div class="semi-col right-semi">${cardHtml(d.s2, 'Semifinal 2 · #2 vs #3', 2, 3, 'semi', times.s2)}</div>`;
    const champCol = `<div class="champ-col${champion ? ' crowned' : ''}">
          <div class="champ-head">
            <span class="champ-trophy" aria-hidden="true">🏆</span>
            <div>
              <div class="champ-lbl">${champion ? 'Champions' : 'Championship'}</div>
              <div class="champ-name">${champion ? esc(champion) : ''}</div>
            </div>
          </div>
          ${cardHtml(d.fin, 'Championship Final', null, null, 'final', times.fin, finT1IsHigher)}
          ${d.third ? `<div class="third-wrap">${cardHtml(d.third, 'Third Place · on the bus', null, null, 'third', times.third)}</div>` : ''}
        </div>`;

    const view = currentView(d);
    stage.dataset.view = view;
    document.getElementById('bracket').innerHTML =
      view === 'semis'  ? `<div class="bracket view-semis">${s1Card}${s2Card}</div>` :
      view === 'finals' ? `<div class="bracket view-finals">${champCol}</div>` :
                          `<div class="bracket view-full">${s1Card}${s2Card}${champCol}</div>`;
    fit();
  }

  /* ---- fit to screen ------------------------------------------------------ */

  const fitEl = document.getElementById('fit');
  const stage = document.getElementById('stage');

  /** Scales the stage to fill the space below the nav, like a slide. */
  function fit() {
    if (innerWidth <= PHONE_MAX && !document.body.classList.contains('display')) { stage.style.transform = ''; fitEl.style.height = ''; return; }
    const nav = document.getElementById('psd-nav');
    const top = nav && nav.offsetParent !== null ? nav.getBoundingClientRect().bottom : 0;
    const availH = Math.max(200, innerHeight - Math.max(0, top));
    fitEl.style.height = availH + 'px';
    const scale = Math.min(innerWidth / (stage.offsetWidth || DESIGN_W), availH / stage.offsetHeight);
    // Centred vertically too, so a short bracket does not hug the top of the stream.
    const offsetY = Math.max(0, (availH - stage.offsetHeight * scale) / 2);
    stage.style.transform = `translate(-50%, ${offsetY}px) scale(${scale})`;
  }
  addEventListener('resize', fit);
  // Web fonts and school logos land after the first layout and change the
  // stage's height; re-fit whenever it changes, whatever the cause.
  if ('ResizeObserver' in window) new ResizeObserver(() => fit()).observe(stage);
  else stage.addEventListener('load', fit, true);
  if (document.fonts) document.fonts.ready.then(fit);

  /* ---- header and refresh ------------------------------------------------ */

  const live = document.getElementById('live');
  const liveMsg = document.getElementById('live-msg');
  const liveTime = document.getElementById('live-time');

  /* #live-msg is read aloud when it changes, so it carries only the state
     (Live, Paused, Reconnecting) and is only rewritten when that changes. The
     time of the last update sits beside it, shown but not announced, or a
     screen reader would read it out every 30 seconds. */
  function setState(text, time) {
    if (liveMsg.textContent !== text) liveMsg.textContent = text;
    if (liveTime) liveTime.textContent = time ? ' · Updated ' + time : '';
  }

  /* ---- pause (WCAG 2.2.2) --------------------------------------------------
     Scores update on their own, so they can be held still. Not on the stream
     view (?stream): nobody is reading it up close, and a paused stream would be
     a stale one. */
  let paused = false;
  const pauseBtn = document.getElementById('live-pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.textContent = paused ? 'Resume updates' : 'Pause updates';
      if (paused) { live.classList.add('stale'); setState('Paused', liveTime && liveTime.dataset.time); }
      else refresh();
    });
  }

  /* ---- display screen ------------------------------------------------------ */

  const hdrRight = document.querySelector('.stage-hdr .right');
  const clock = document.createElement('span');
  clock.className = 'clock';
  clock.setAttribute('aria-hidden', 'true');   // decoration on a wall screen; the OS clock is the accessible one
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'disp-btn disp-open';
  openBtn.innerHTML = '<span aria-hidden="true">🖵</span> Display screen';
  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'disp-btn disp-exit';
  exitBtn.textContent = 'Exit display';
  hdrRight.prepend(clock);
  hdrRight.append(openBtn, exitBtn);

  function tick() {
    if (window.PSD_NAV && PSD_NAV.still && PSD_NAV.still()) return;   // held by the pause-animations switch
    clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  tick();
  setInterval(tick, 20000);

  /* The address carries the state, so a screen set up on the day can be
     bookmarked or reopened after a reboot exactly as it was. */
  function writeUrl(on) {
    if (STREAM || !history.replaceState) return;
    const u = new URL(location.href);
    if (on) u.searchParams.set('display', '1'); else u.searchParams.delete('display');
    history.replaceState(null, '', u.toString());
  }

  /* ---- views ----------------------------------------------------------------

     Semifinals, Finals, or the Full bracket. Only one stage is played at a
     time, so the screen shows that stage's two matches at about twice the size
     the full bracket allows. "Auto" follows the day: Semifinals until both are
     decided, then Finals. Picking a view pins it; picking the one auto would
     show anyway goes back to following the day, so a screen can never be left
     stuck on the semifinals by mistake. ?view=semis|finals|full pins it from
     the address, for a bookmarked screen. */

  const VIEWS = [['semis', 'Semifinals'], ['finals', 'Finals'], ['full', 'Full bracket']];
  let pinned = VIEWS.some(v => v[0] === params.get('view')) ? params.get('view') : null;
  let lastData = null;

  const tabs = document.createElement('div');
  tabs.className = 'view-tabs';
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Bracket view');
  tabs.innerHTML = '<span></span><div class="view-btns">' + VIEWS.map(([id, name]) =>
    `<button type="button" class="view-tab" data-view="${id}" aria-pressed="false">${name}</button>`).join('') +
    '</div><div class="view-tools"></div>';
  document.querySelector('.stage-hdr').after(tabs);
  // Pause and Display sit on this row, so the title row stays one line on every view.
  tabs.querySelector('.view-tools').append(...[pauseBtn, openBtn, exitBtn].filter(Boolean));

  function winnerOf(m) {
    const a = calcMatch(m.a.t1, m.a.t2), b = calcMatch(m.b.t1, m.b.t2);
    return solveMatchup(m.school1, m.school2, a, b, m.tb1, m.tb2).winner;
  }
  function autoView(d) { return winnerOf(d.s1) && winnerOf(d.s2) ? 'finals' : 'semis'; }

  function currentView(d) {
    lastData = d;
    const auto = autoView(d);
    const view = pinned || auto;
    tabs.querySelectorAll('.view-tab').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
    });
    return view;
  }

  function pickView(id) {
    pinned = lastData && id === autoView(lastData) ? null : id;
    if (!STREAM && history.replaceState) {
      const u = new URL(location.href);
      if (pinned) u.searchParams.set('view', pinned); else u.searchParams.delete('view');
      history.replaceState(null, '', u.toString());
    }
    if (lastData) render(lastData);
  }
  tabs.addEventListener('click', e => {
    const b = e.target.closest('.view-tab');
    if (b) pickView(b.dataset.view);
  });

  function setDisplay(on) {
    document.body.classList.toggle('display', on);
    document.documentElement.classList.toggle('display', on);
    writeUrl(on);
    fit();
    (on ? exitBtn : openBtn).focus();
    wake();
  }
  openBtn.addEventListener('click', () => setDisplay(true));
  exitBtn.addEventListener('click', () => setDisplay(false));
  document.addEventListener('keydown', e => {
    /* On the display screen the arrow keys step through the views. */
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && document.body.classList.contains('display') && lastData) {
      const order = VIEWS.map(v => v[0]);
      const at = order.indexOf(stage.dataset.view);
      pickView(order[(at + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length]);
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape' && !STREAM && document.body.classList.contains('display')) { e.preventDefault(); setDisplay(false); }
  });

  /* The controls stay out of the picture until someone reaches for them. Not
     while one has focus, where a keyboard user is working, and not while
     updates are paused, which nobody should be able to leave on unseen. */
  let idleTimer = null;
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function hide() {
      const busy = document.activeElement && document.activeElement.closest && document.activeElement.closest('.view-tabs button');
      if (busy || paused) { idleTimer = setTimeout(hide, 4000); return; }
      document.body.classList.add('idle');
    }, 4000);
  }
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'focusin'].forEach(t => document.addEventListener(t, wake));

  if (!STREAM && params.get('display') === '1') {
    document.body.classList.add('display');
    document.documentElement.classList.add('display');
    wake();
  }

  function initHeader() {
    const d = PSD.finalsStart();
    document.getElementById('finals-date').textContent = d
      ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' · Quail Valley Esports Arena'
      : 'Date to be announced · Quail Valley Esports Arena';
  }

  let loadedOnce = false;
  async function refresh() {
    if (paused) return;
    if (!lg.matchSheet || !lg.finalsGid) {
      setState('Bracket opens once the regular season ends');
      live.classList.add('stale');
      document.getElementById('bracket').innerHTML = '<div class="notice">The bracket will appear here once the regular season ends.</div>';
      fit();
      return;
    }
    try {
      const rows = await fetchRows();
      if (paused) return;
      const d = parseSheet(rows);
      if (!d) {
        // The tab has not been set up in the 2026-27 layout yet.
        live.classList.add('stale');
        setState('Bracket not set up yet');
        document.getElementById('bracket').innerHTML = '<div class="notice">The bracket will appear here once the finals sheet is set up.</div>';
        fit();
        return;
      }
      render(d);
      loadedOnce = true;
      live.classList.remove('stale');
      const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      if (liveTime) liveTime.dataset.time = time;
      setState('Live', time);
    } catch (e) {
      console.error(e);
      if (paused) return;
      // Keep the last good bracket on screen rather than blanking it mid-stream.
      live.classList.add('stale');
      setState(loadedOnce ? 'Reconnecting…' : 'Could not load the bracket, retrying');
      if (!loadedOnce) fit();
    }
  }

  initHeader();
  fit();
  refresh();
  /* The bracket tab is read through the fast feed, so on finals day the page
     itself is the slowest link, hence every 30 seconds. A tab left open in the
     background stops asking and catches up the moment it is looked at again. */
  setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
})();
