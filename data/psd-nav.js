/* ==========================================================================
   PSD Esports — site navigation.

   ONE PLACE TO ADD A NEW TITLE.

   The site is organised into SECTIONS, one per game. Each section is
   self-contained — its own pages, its own rules, its own colour — and the nav
   is how you cross between them. A page belongs to exactly one section and
   only ever shows that section's links inline; the other sections are one
   click away in the bar.

   To add a title: add an entry to SECTIONS below. Every page picks it up, and
   nothing else needs editing.

   Paths are absolute from the site root. The site is served at the root of
   psdesports.com (which is why the favicons are already /favicon.svg), so a
   page in /smash/ and a page at the root can share one link list without
   juggling "../" prefixes.
   ========================================================================== */

(function (root) {
  'use strict';

  /* ---- visit counting: Cloudflare Web Analytics ------------------------------
     No cookies, no personal data. Loaded from here because every page loads
     this file, so new pages are counted automatically. Only on the real domain,
     so local testing does not inflate the numbers. Dashboard: Cloudflare →
     Analytics & Logs → Web Analytics. */
  if (/(^|\.)psdesports\.com$/i.test(location.hostname) &&
      !document.querySelector('script[src*="cloudflareinsights.com"]')) {
    var beacon = document.createElement('script');
    beacon.defer = true;
    beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    beacon.setAttribute('data-cf-beacon', '{"token": "4e3719cfa28547039e276aad9dbd63e9"}');
    document.head.appendChild(beacon);
  }

  /* ---- open registration ---------------------------------------------------

     A time-limited call to action, so it lives here rather than in SECTIONS:
     it appears as a highlighted pill on EVERY page, and it takes itself down
     the day after entries close. Nobody has to remember to remove it, and no
     visitor is ever invited to register for something that has already shut.

     `closes` is the last day entries are accepted, inclusive.

     THESE TWO MUST MATCH data/smash.js (registerUrl / registerBy). They are
     repeated here because the nav loads on all fifteen pages and smash.js
     loads on four, and making every Rocket League page pull in a tournament
     config to draw one link is the worse trade. The check below catches the
     two drifting apart on any page where both are present.
     -------------------------------------------------------------------------- */

  /* `label` names the game on purpose. The pill sits on every page, Rocket
     League included, and a bare "Register" beside a multi-game nav reads as
     "register for the league" — a Rocket League parent clicking it would land
     on a Smash form. The closing date is appended from `closes` below rather
     than typed into the label, so the two cannot disagree. */
  var REGISTRATION = {
    url:    'https://forms.gle/PHLTBQBWvUJktBgw8',
    closes: '2026-10-30',
    label:  '⚔️ Smash Sign-Up',
    title:  'Register a team for the Super Smash Bros. tournament'
  };

  /**
   * Attributes for a link that leaves the site.
   *
   * The registration form is a Google Form, so it opens in its own tab: a coach
   * halfway through filling one in should not lose it by pressing Back, and the
   * site they came from is still sitting behind it when they finish. `noopener`
   * because a new tab otherwise gets a handle on this one.
   */
  function out(l) {
    return (l && l.external ? ' target="_blank" rel="noopener"' : '') +
           (l && l.title ? ' title="' + esc(l.title) + '"' : '');
  }

  /** True until the end of the closing day, in the reader's own time zone. */
  function registrationOpen() {
    var end = new Date(REGISTRATION.closes + 'T00:00:00');
    if (isNaN(end)) return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return end >= today;
  }

  var SECTIONS = [
    {
      id: 'rocket-league',
      name: 'Rocket League',
      icon: '🚀',
      accent: '#4DABF7',
      /* groups render as labelled blocks inside the dropdown */
      groups: [
        {
          label: 'Early Release · Tue 2:00 PM',
          accent: '#FF6B6B',
          links: [
            { text: 'Standings',    href: '/rocket-league/jr-promise-league.html' },
            { text: 'Schedule',     href: '/rocket-league/jr-promise-league-schedule.html' },
            { text: 'Player Stats', href: '/rocket-league/jr-promise-league-stats.html' }
          ]
        },
        {
          label: 'Late Release · Mon 4:00 PM',
          accent: '#4DABF7',
          links: [
            { text: 'Standings',    href: '/rocket-league/promise-league.html' },
            { text: 'Schedule',     href: '/rocket-league/promise-league-schedule.html' },
            { text: 'Player Stats', href: '/rocket-league/promise-league-stats.html' }
          ]
        },
        {
          label: 'More',
          accent: '#9ca3af',
          links: [
            { text: 'Rules',       href: '/rocket-league/rules.html' },
            { text: 'Match Setup', href: '/rocket-league/match-setup.html' },
            { text: 'Badge Guide', href: '/rocket-league/badges.html' },
            { text: 'Finals',      href: '/rocket-league/finals.html' }
          ]
        }
      ]
    },
    {
      id: 'smash',
      name: 'Smash Bros',
      icon: '⚔️',
      accent: '#FDB913',

      groups: [
        {
          label: 'One-Day Tournament · Sat 14 Nov',
          accent: '#FDB913',
          links: [
            { text: 'Overview',        href: '/smash/tournament.html' },
            { text: 'Flyer',           href: '/smash/flyer.html' },
            { text: 'Grade 5 & Under', href: '/smash/grade-5-under.html' },
            { text: 'Grades 6–8',      href: '/smash/grades-6-8.html' },
            /* Not last: the sign-up pill comes straight after this list in the
               page, and two links in a row to the same form is one too many
               for anyone tabbing through. */
            { text: 'Register a Team', href: REGISTRATION.url, external: true },
            { text: 'Rules',           href: '/smash/rules.html' }
          ]
        }
      ]
    }
  ];

  /* Links that belong to the whole site rather than any one title. */
  var SITEWIDE = [
    { text: '🏅 Champions', href: '/champions.html', cls: 'pill-champs' },
    { text: '📰 In the News', href: '/media.html' },
    { text: '🎮 Games', href: '/games.html' }
  ];

  /* ---- motion -------------------------------------------------------------

     WCAG 2.2.2 asks for a way to stop anything that moves on its own for more
     than five seconds: the particle backdrops, the champions ticker, pulsing
     live dots, countdowns. One switch in this bar covers every page, because
     every page loads this file. It is remembered per browser, and it starts
     on for anyone whose device already asks for reduced motion.

     Set here, before the page draws, so nothing visibly starts and stops. The
     reset mirrors the reduced-motion blocks already in the pages: every
     animation jumps straight to its end, so nothing is left half-faded. */
  var MOTION_KEY = 'psd-motion';
  var MOTION_CSS =
    'html.psd-still *,html.psd-still *::before,html.psd-still *::after{animation-duration:.01ms!important;' +
      'animation-iteration-count:1!important;animation-delay:0s!important;scroll-behavior:auto!important;}' +
    'html.psd-still #particleCanvas,html.psd-still #heroParticles{display:none!important;}';

  function storedMotion() {
    try { return localStorage.getItem(MOTION_KEY); } catch (e) { return null; }
  }
  function isStill() { return document.documentElement.classList.contains('psd-still'); }
  function setStill(still, remember) {
    document.documentElement.classList.toggle('psd-still', still);
    if (remember) { try { localStorage.setItem(MOTION_KEY, still ? 'still' : 'moving'); } catch (e) {} }
    var detail = { still: still };
    try { document.dispatchEvent(new CustomEvent('psd:motion', { detail: detail })); } catch (e) {}
  }
  (function () {
    var style = document.createElement('style');
    style.textContent = MOTION_CSS;
    document.head.appendChild(style);
    var saved = storedMotion();
    var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setStill(saved ? saved === 'still' : !!reduce, false);
  })();

  /* ---- display settings -----------------------------------------------------

     High contrast, text size and a readable font, chosen from the "Aa" panel in
     the bar and remembered per browser. Like motion, they are applied here,
     before the page draws, so a page never flashes its usual look first. Each
     is a class on <html>, so every page's own styles are overridden from one
     place rather than edited one by one.

     High contrast is black, white and yellow (21:1 and 19.6:1, past WCAG AAA's
     7:1). Gradients, glows, tints and photo backdrops go; links are yellow and
     underlined; whatever is selected or current is a solid yellow block, so
     state never depends on a colour that has been flattened.

     Text size scales the root font size. Nearly every size on the site is in
     rem, so the pages reflow rather than zoom. The two finals stream pages
     (.fit) are sized to the screen exactly and keep their size.

     The readable font is Atkinson Hyperlegible, from the Braille Institute,
     fetched only by those who turn it on. Headings lose their slant and
     capitals, which are the hardest part of the usual look to read. */
  var PREFS = {
    contrast: { key: 'psd-contrast', values: ['standard', 'high'],     def: 'standard' },
    text:     { key: 'psd-text',     values: ['100', '125', '150'],    def: '100' },
    font:     { key: 'psd-font',     values: ['standard', 'readable'], def: 'standard' }
  };
  /* Storage can be blocked (private windows, school device policies), so the
     choice still holds for the current page when it cannot be saved. */
  var prefMemory = {};

  var DISPLAY_CSS = [
    /* -- high contrast -- */
    'html.psd-hc{color-scheme:dark;}',
    'html.psd-hc,html.psd-hc body{background:#000!important;color:#fff!important;}',
    'html.psd-hc *{background-color:#000!important;}',
    'html.psd-hc *::before,html.psd-hc *::after{background-color:transparent!important;}',
    'html.psd-hc *,html.psd-hc *::before,html.psd-hc *::after{background-image:none!important;color:#fff!important;',
      '-webkit-text-fill-color:currentColor!important;text-shadow:none!important;box-shadow:none!important;',
      'backdrop-filter:none!important;-webkit-backdrop-filter:none!important;border-color:#fff!important;',
      /* edge fades on the scrolling rows would grey out the text at each end */
      'mask-image:none!important;-webkit-mask-image:none!important;}',
    'html.psd-hc a,html.psd-hc a *,html.psd-hc button,html.psd-hc button *,html.psd-hc summary,html.psd-hc summary *{color:#FFFF00!important;}',
    'html.psd-hc a{text-decoration:underline!important;text-underline-offset:.18em;}',
    'html.psd-hc button,html.psd-hc select,html.psd-hc input,html.psd-hc textarea{border-color:#FFFF00!important;}',
    /* a button drawn as bare text (Print schedule) would read as a label */
    'html.psd-hc main button{border:2px solid #FFFF00!important;}',
    'html.psd-hc .active,html.psd-hc .active *,html.psd-hc [aria-current="page"],html.psd-hc [aria-current="page"] *,',
      'html.psd-hc [aria-pressed="true"],html.psd-hc [aria-pressed="true"] *,html.psd-hc [aria-selected="true"],',
      'html.psd-hc [aria-selected="true"] *{background-color:#FFFF00!important;color:#000!important;}',
    'html.psd-hc :focus-visible{outline:3px solid #FFFF00!important;outline-offset:2px!important;}',
    'html.psd-hc ::placeholder{color:#d4d4d4!important;-webkit-text-fill-color:#d4d4d4!important;}',
    'html.psd-hc ::selection{background:#FFFF00;color:#000;-webkit-text-fill-color:#000;}',
    'html.psd-hc #particleCanvas,html.psd-hc #heroParticles{display:none!important;}',
    /* Winners are shown by colour alone (green names, gold scores) on the
       schedules and brackets. With the colour gone, they are marked outright. */
    'html.psd-hc .competitor.win .comp-name,html.psd-hc .bk-team.won,html.psd-hc .fix-row .side.won,',
      'html.psd-hc #sd .sd-team.won,html.psd-hc .winner .team-name{font-weight:800!important;}',
    'html.psd-hc .competitor.win .comp-name::after,html.psd-hc .bk-team.won::after,html.psd-hc .fix-row .side.won::after,',
      'html.psd-hc #sd .sd-team.won::after,html.psd-hc .winner .team-name::after{content:" \\2713";color:#FFFF00!important;',
      '-webkit-text-fill-color:#FFFF00!important;font-weight:800;}',
    'html.psd-hc #psd-nav .nav-hamburger span{background-color:#FFFF00!important;}',
    'html.psd-hc #psd-nav .nav-hamburger,html.psd-hc #psd-nav .nav-link{border:none!important;}',
    'html.psd-hc #psd-nav,html.psd-hc #psd-nav-drawer{border-bottom:2px solid #fff!important;}',
    /* -- text size -- */
    'html.psd-t125{font-size:125%!important;}',
    'html.psd-t150{font-size:150%!important;}',
    'html.psd-t125 .text-\\[11px\\],html.psd-t150 .text-\\[11px\\]{font-size:.6875rem!important;}',
    'html.psd-t125:has(.fit),html.psd-t150:has(.fit){font-size:100%!important;}',
    /* At larger sizes an unbreakable string (an email address) can be wider
       than a phone screen. It breaks only when it would otherwise overflow;
       ordinary words and numbers stay whole. */
    'html.psd-t125 body,html.psd-t150 body{overflow-wrap:break-word;}',
    /* A page title is already big. On a phone, scaled further, one long word
       ("Achievement") no longer fits the screen, so there it follows the
       width instead; 11vw is still at least the size it has normally. */
    '@media (max-width:600px){html.psd-t125 h1,html.psd-t150 h1{font-size:min(2.75rem,11vw)!important;}}',
    /* Rows that sit on one line at normal size and must wrap when larger:
       the badge guide's tier name and count, the games filter buttons, and
       a champions season heading with its label. */
    'html.psd-t125 :is(.seg,:has(> .tier-count),:has(> .season-pill)),',
      'html.psd-t150 :is(.seg,:has(> .tier-count),:has(> .season-pill)){flex-wrap:wrap;}',
    /* Match setup's settings table, name | value, has no scrolling box around
       it. On a phone with larger text each name sits above its value. */
    '@media (max-width:600px){html.psd-t125 table.settings :is(tr,th,td),html.psd-t150 table.settings :is(tr,th,td){display:block;}',
      'html.psd-t125 table.settings td,html.psd-t150 table.settings td{padding-top:0!important;}}',
    /* the home page's coach contacts: name and address side by side */
    'html.psd-t125 .contact-bar-link,html.psd-t150 .contact-bar-link{flex-wrap:wrap;justify-content:center;max-width:100%;min-width:0;}',
    'html.psd-t125 .contact-email,html.psd-t150 .contact-email{overflow-wrap:anywhere;white-space:normal;min-width:0;}',
    /* The home page's "Fall / Season" is already 8rem. Scaled further, one
       word outgrows its half of the hero and is clipped, so at larger sizes
       it follows the window instead. It is never smaller than on a phone. */
    'html.psd-t125 h1 .lg\\:text-9xl,html.psd-t150 h1 .lg\\:text-9xl{font-size:clamp(3.75rem,10vw,8rem)!important;}',
    /* -- readable font -- */
    "html.psd-readable body,html.psd-readable body *{font-family:'Atkinson Hyperlegible',Verdana,sans-serif!important;font-style:normal!important;}",
    'html.psd-readable h1,html.psd-readable h2,html.psd-readable h3,html.psd-readable h4{text-transform:none!important;letter-spacing:normal!important;}',
    /* Windows' own high-contrast mode recolours text but not gradient text,
       which is drawn as a clipped background and would vanish. */
    '@media (forced-colors:active){*{-webkit-text-fill-color:currentColor!important;}}'
  ].join('');

  function getPref(name) {
    var p = PREFS[name], v = prefMemory[name];
    if (v == null) { try { v = localStorage.getItem(p.key); } catch (e) { v = null; } }
    return p.values.indexOf(v) >= 0 ? v : p.def;
  }

  function loadReadableFont() {
    if (document.getElementById('psd-readable-font')) return;
    var link = document.createElement('link');
    link.id = 'psd-readable-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap';
    document.head.appendChild(link);
  }

  function applyPrefs() {
    var c = document.documentElement.classList, text = getPref('text');
    c.toggle('psd-hc', getPref('contrast') === 'high');
    c.toggle('psd-t125', text === '125');
    c.toggle('psd-t150', text === '150');
    var readable = getPref('font') === 'readable';
    c.toggle('psd-readable', readable);
    if (readable) loadReadableFont();
  }

  function setPref(name, value) {
    var p = PREFS[name];
    prefMemory[name] = value;
    try {
      if (value === p.def) localStorage.removeItem(p.key);
      else localStorage.setItem(p.key, value);
    } catch (e) {}
    applyPrefs();
    try { document.dispatchEvent(new CustomEvent('psd:display', { detail: { name: name, value: value } })); } catch (e) {}
  }

  (function () {
    var style = document.createElement('style');
    style.textContent = DISPLAY_CSS;
    document.head.appendChild(style);
    applyPrefs();
  })();

  /* Emoji in a label are decoration. Screen readers otherwise read them out
     ("sports medal Champions"), so a leading one is hidden from them. */
  function withIcon(text) {
    var m = /^(\S+)\s+(.*)$/.exec(text);
    if (m && /[☀-➿\uD83C-\uDBFF]/.test(m[1])) {
      return '<span aria-hidden="true">' + esc(m[1]) + '</span> ' + esc(m[2]);
    }
    return esc(text);
  }

  /* Open registration gets the centre of the bar to itself, apart from the
     sitewide pills, so it reads as the one call to action rather than one more
     link. There is only ever one sign-up open at a time, so one slot is all it
     needs. Null once entries close, and the bar goes back to its usual shape. */
  var PROMO = null;
  if (registrationOpen()) {
    var closesOn = new Date(REGISTRATION.closes + 'T00:00:00');
    PROMO = {
      text: REGISTRATION.label + ' · ' +
            closesOn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      title: REGISTRATION.title + ' — entries close ' +
             closesOn.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      href: REGISTRATION.url,
      external: true
    };
  }

  var CSS = [
    '#psd-nav{position:sticky;top:0;z-index:1000;background:rgba(13,17,25,.82);backdrop-filter:blur(14px);',
      '-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08);',
      "font-family:'Rajdhani',sans-serif;transition:background .3s,box-shadow .3s,border-color .3s;}",
    '#psd-nav.nav-scrolled{background:rgba(9,12,18,.92);box-shadow:0 4px 32px rgba(0,0,0,.6);border-bottom-color:rgba(255,255,255,.05);}',
    '#psd-nav.nav-scrolled .nav-inner{height:42px;}',
    '#psd-nav.nav-scrolled .nav-link{height:42px;}',
    /* The min()s only bite on a phone with larger text turned on, where the
       brand and the menu button would otherwise not fit side by side. */
    '#psd-nav .nav-inner{max-width:1280px;margin:0 auto;padding:0 min(1.25rem,4vw);display:flex;align-items:center;height:52px;transition:height .3s cubic-bezier(.4,0,.2,1);}',
    '#psd-nav .nav-brand{font-weight:900;font-size:min(1.1rem,5vw);letter-spacing:.08em;text-transform:uppercase;color:#fff;',
      'text-decoration:none;white-space:nowrap;display:flex;align-items:center;gap:.5rem;margin-right:min(1.5rem,3vw);}',
    '#psd-nav .nav-brand span{background:linear-gradient(90deg,#FF6B6B,#FFD166,#4DABF7,#FF6B6B);background-size:250% auto;',
      '-webkit-background-clip:text;background-clip:text;color:transparent;animation:brand-shift 5s linear infinite;}',
    '@keyframes brand-shift{to{background-position:250% center}}',
    '#psd-nav .nav-logo{width:34px;height:34px;object-fit:contain;transition:width .3s,height .3s;}',
    '#psd-nav.nav-scrolled .nav-logo{width:28px;height:28px;}',
    '#psd-nav .nav-links{display:flex;align-items:center;gap:.15rem;list-style:none;margin:0;padding:0;flex:1;}',
    '#psd-nav .nav-item{position:relative;}',
    '#psd-nav .nav-link{display:flex;align-items:center;gap:.4rem;padding:.4rem .85rem;font-weight:700;font-size:.8rem;',
      'letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;text-decoration:none;border-radius:6px 6px 0 0;',
      'transition:color .15s,background .15s;white-space:nowrap;cursor:pointer;background:none;border:none;height:52px;font-family:inherit;}',
    '#psd-nav .nav-link:hover{color:#fff;background:rgba(255,255,255,.06);}',
    /* one visible keyboard focus ring for everything in the bar */
    '#psd-nav a:focus-visible,#psd-nav button:focus-visible,#psd-nav-drawer a:focus-visible,#psd-nav-drawer button:focus-visible,',
      '#psd-nav-drawer summary:focus-visible,.psd-skip:focus-visible{outline:2px solid #FFD166;outline-offset:2px;}',
    /* the section this page belongs to */
    '#psd-nav .nav-item.current .nav-link{color:#fff;background:rgba(255,255,255,.06);border-bottom:2px solid var(--sect,#FDB913);}',
    '#psd-nav .nav-chevron{font-size:.6875rem;opacity:.55;transition:transform .2s;}',
    '#psd-nav .nav-item:hover .nav-chevron,#psd-nav .nav-item.open .nav-chevron{transform:rotate(180deg);}',
    '#psd-nav .nav-dropdown{display:none;position:absolute;top:100%;left:0;min-width:225px;background:#151B26;',
      'border:1px solid rgba(255,255,255,.1);border-radius:0 8px 8px 8px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.8);}',
    /* Hover opens a menu for the mouse; .open is set by keyboard focus, a tap
       or a click. Escape adds .dismissed, which wins until the pointer or focus
       moves on (WCAG 1.4.13: content shown on hover can be dismissed). */
    '#psd-nav .nav-item:hover .nav-dropdown,#psd-nav .nav-item.open .nav-dropdown{display:block;}',
    '#psd-nav .nav-item.dismissed .nav-dropdown{display:none;}',
    '#psd-nav .nav-dropdown a{display:flex;align-items:center;gap:.5rem;padding:.55rem 1rem;font-weight:700;font-size:.76rem;',
      'letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;text-decoration:none;transition:color .15s,background .15s;}',
    '#psd-nav .nav-dropdown a:hover{color:#fff;background:rgba(255,255,255,.07);}',
    '#psd-nav .nav-dropdown a.active{color:#fff;background:rgba(255,255,255,.07);border-left:3px solid var(--grp,#4DABF7);padding-left:calc(1rem - 3px);}',
    '#psd-nav .dd-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}',
    "#psd-nav .dd-header{padding:.5rem 1rem .25rem;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.6875rem;",
      'letter-spacing:.2em;text-transform:uppercase;color:#8f97a5;border-top:1px solid rgba(255,255,255,.06);}',
    '#psd-nav .dd-header:first-child{border-top:none;}',
    '#psd-nav .nav-right{margin-left:auto;display:flex;align-items:center;gap:.5rem;}',
    '#psd-nav .nav-pill{padding:.3rem .9rem;font-weight:700;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;',
      'border-radius:9999px;text-decoration:none;white-space:nowrap;transition:background .15s,border-color .15s,color .15s;',
      /* A colour of its own, always. Pages without Tailwind have nothing
         resetting link colour, so a pill with no colour class fell back to the
         browser's blue and visited purple — unreadable on the dark bar. */
      'color:#fff;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.18);}',
    '#psd-nav .nav-pill:hover,#psd-nav .nav-pill.active{color:#FF6B6B;background:rgba(200,16,46,.14);border-color:rgba(255,107,107,.5);}',
    '#psd-nav .pill-champs{background:rgba(255,215,0,.1);color:#FFD166;border:1px solid rgba(255,215,0,.22);}',
    '#psd-nav .pill-champs:hover,#psd-nav .pill-champs.active{color:#FFD166;background:rgba(255,215,0,.22);border-color:rgba(255,215,0,.5);}',
    /* Registration is the one thing on this site with a deadline, so it is the
       only pill that is filled rather than outlined. It reads as a button next
       to the others, which is what it is. */
    '#psd-nav .pill-register{background:#FDB913;color:#0B0E14;border:1px solid #FDB913;font-weight:800;}',
    '#psd-nav .pill-register:hover{color:#0B0E14;background:#FFD166;border-color:#FFD166;}',
    '#psd-nav-drawer a.drawer-register{color:#0B0E14;background:#FDB913;font-weight:800;border-radius:6px;margin:.35rem 0;}',
    '#psd-nav .nav-left{display:flex;align-items:center;flex:1;}',
    '#psd-nav .nav-end{display:flex;align-items:center;margin-left:auto;}',
    /* With a promo the bar becomes three columns, 1fr | auto | 1fr, so the pill
       sits at the true centre of the bar. A 1fr track will not shrink below its
       content, so when the window is too narrow for equal sides the left column
       keeps its width and the pill slides right instead of sliding under the
       game menus. Explicit columns keep the right-hand group in column 3 when
       the pill is hidden on small screens. */
    '#psd-nav .nav-inner.has-promo{display:grid;grid-template-columns:1fr auto 1fr;column-gap:1rem;}',
    '#psd-nav .has-promo .nav-left{grid-column:1;}',
    '#psd-nav .has-promo .nav-promo{grid-column:2;}',
    '#psd-nav .has-promo .nav-end{grid-column:3;justify-self:end;}',
    '#psd-nav .nav-hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:.5rem;background:none;border:none;margin-left:auto;}',
    '#psd-nav .nav-hamburger span{display:block;width:22px;height:2px;background:#9ca3af;border-radius:2px;transition:all .25s;}',
    '#psd-nav .nav-hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}',
    '#psd-nav .nav-hamburger.open span:nth-child(2){opacity:0;}',
    '#psd-nav .nav-hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}',
    '#psd-nav-drawer{display:none;position:relative;z-index:999;background:#0d1119;border-bottom:1px solid rgba(255,255,255,.08);padding:.75rem 1.25rem 1rem;}',
    '#psd-nav-drawer.open{display:block;}',
    "#psd-nav-drawer a{display:block;padding:.5rem .75rem;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.88rem;",
      'letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;text-decoration:none;border-radius:6px;}',
    '#psd-nav-drawer a:hover,#psd-nav-drawer a.active{color:#fff;background:rgba(255,255,255,.06);}',
    "#psd-nav-drawer .drawer-section{font-size:.6875rem;letter-spacing:.2em;text-transform:uppercase;color:#8f97a5;",
      "font-family:'Rajdhani',sans-serif;font-weight:700;padding:.5rem .75rem .2rem;margin-top:.4rem;}",
    '#psd-nav-drawer .drawer-title{font-size:.72rem;letter-spacing:.16em;color:#e5e7eb;padding:.6rem .75rem .2rem;margin-top:.6rem;',
      'border-top:1px solid rgba(255,255,255,.07);}',
    '#psd-nav-drawer .drawer-indent{padding-left:1.5rem;}',
    /* Each game is a collapsible block, closed except for the one this page is
       in, and each group's links sit side by side as chips instead of one per row. */
    '#psd-nav-drawer details{border-top:1px solid rgba(255,255,255,.07);margin-top:.4rem;}',
    "#psd-nav-drawer summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:.5rem;padding:.75rem .75rem;",
      "font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.85rem;letter-spacing:.14em;text-transform:uppercase;color:#e5e7eb;border-radius:6px;}",
    '#psd-nav-drawer summary::-webkit-details-marker{display:none;}',
    '#psd-nav-drawer summary:hover{background:rgba(255,255,255,.04);}',
    '#psd-nav-drawer summary .sum-chev{margin-left:auto;font-size:.6875rem;opacity:.6;transition:transform .2s;}',
    '#psd-nav-drawer details[open] summary .sum-chev{transform:rotate(180deg);}',
    '#psd-nav-drawer details[open] summary{color:var(--sect,#fff);}',
    '#psd-nav-drawer .drawer-body{padding:0 0 .5rem;}',
    '#psd-nav-drawer .drawer-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.35rem;padding:.15rem .75rem .35rem;}',
    '#psd-nav-drawer .drawer-chips a{display:flex;align-items:center;justify-content:center;text-align:center;padding:.5rem .3rem;font-size:.74rem;letter-spacing:.06em;',
      'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);line-height:1.15;}',
    '#psd-nav-drawer .drawer-chips a.active{border-color:var(--grp,#fff);color:#fff;}',
    '#psd-nav-drawer .drawer-more{border-top:1px solid rgba(255,255,255,.07);margin-top:.4rem;padding-top:.4rem;}',
    /* pause-animations switch: an icon in the bar, a labelled row in the drawer */
    '#psd-nav .nav-motion{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;',
      'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.18);color:#e5e7eb;cursor:pointer;font-size:.7rem;line-height:1;padding:0;}',
    '#psd-nav .nav-motion:hover{color:#fff;background:rgba(255,255,255,.1);}',
    '#psd-nav .nav-motion[aria-pressed="true"]{color:#0B0E14;background:#FFD166;border-color:#FFD166;}',
    "#psd-nav-drawer .drawer-motion{display:block;width:100%;text-align:left;padding:.5rem .75rem;margin-top:.4rem;font-family:'Rajdhani',sans-serif;",
      'font-weight:700;font-size:.88rem;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;background:none;',
      'border:none;border-top:1px solid rgba(255,255,255,.07);cursor:pointer;}',
    '#psd-nav-drawer .drawer-motion:hover{color:#fff;}',
    /* display settings: the "Aa" button opens a panel under it; the drawer
       carries the same controls in a collapsible block */
    '#psd-nav .nav-display{position:relative;}',
    "#psd-nav .nav-aa{font-family:'Rajdhani',sans-serif;font-weight:800;font-size:.8rem;letter-spacing:0;}",
    '#psd-nav .nav-aa[aria-expanded="true"]{color:#0B0E14;background:#FFD166;border-color:#FFD166;}',
    '#psd-nav .psd-display{position:absolute;right:0;top:calc(100% + .6rem);width:17rem;background:#151B26;',
      'border:1px solid rgba(255,255,255,.14);border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,.8);padding:.9rem 1rem 1rem;z-index:1001;}',
    '#psd-nav .psd-display[hidden]{display:none;}',
    ".pd-title{margin:0 0 .5rem;font-family:'Rajdhani',sans-serif;font-weight:800;font-size:.85rem;letter-spacing:.14em;",
      'text-transform:uppercase;color:#fff;}',
    '.pd-set{border:none;margin:0;padding:.5rem 0 .55rem;border-top:1px solid rgba(255,255,255,.08);}',
    /* floated so it sits under the group's top rule rather than cutting it */
    ".pd-set legend{float:left;width:100%;padding:0 0 .35rem;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.72rem;letter-spacing:.16em;",
      'text-transform:uppercase;color:#a3abb9;}',
    '.pd-opts{clear:both;display:flex;flex-wrap:wrap;gap:.35rem;}',
    '#psd-nav-drawer .drawer-display summary > span:first-child{text-transform:none;letter-spacing:0;}',
    /* Each option is a real radio button: the browser already knows how to
       move through, announce and select those. The dot is hidden and the
       whole label is the target, drawn as a segment that fills when chosen. */
    ".pd-opt{position:relative;display:inline-flex;align-items:center;min-height:2rem;padding:.25rem .7rem;border-radius:6px;",
      "border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#e5e7eb;cursor:pointer;",
      "font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:.85rem;font-weight:600;}",
    '.pd-opt input{position:absolute;opacity:0;width:1px;height:1px;margin:0;}',
    '.pd-opt:hover{background:rgba(255,255,255,.1);}',
    '.pd-opt:has(input:checked){background:#FFD166;border-color:#FFD166;color:#0B0E14;}',
    '.pd-opt:has(input:focus-visible){outline:2px solid #FFD166;outline-offset:2px;}',
    ".pd-check{display:flex;align-items:center;gap:.55rem;padding:.6rem 0 .2rem;border-top:1px solid rgba(255,255,255,.08);",
      "color:#e5e7eb;cursor:pointer;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:.85rem;font-weight:600;}",
    '.pd-check input{width:1.1rem;height:1.1rem;accent-color:#FFD166;margin:0;}',
    ".pd-reset{margin-top:.7rem;width:100%;padding:.45rem;border-radius:6px;border:1px solid rgba(255,255,255,.18);background:none;",
      "color:#e5e7eb;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;}",
    '.pd-reset:hover{background:rgba(255,255,255,.08);color:#fff;}',
    '.pd-reset:focus-visible{outline:2px solid #FFD166;outline-offset:2px;}',
    /* in high contrast the panel follows the same rules as the page */
    'html.psd-hc .pd-opt:has(input:checked),html.psd-hc .pd-opt:has(input:checked) *{background-color:#FFFF00!important;color:#000!important;}',
    'html.psd-hc .pd-opt:has(input:focus-visible){outline:3px solid #FFFF00!important;}',
    'html.psd-hc .pd-check input{accent-color:#FFFF00;}',
    '#psd-nav-drawer .drawer-display{border-top:1px solid rgba(255,255,255,.07);margin-top:.4rem;}',
    '#psd-nav-drawer .drawer-display .pd-body{padding:.1rem .75rem .6rem;}',
    '#psd-nav-drawer .drawer-display .pd-title{display:none;}',
    /* The bar is sticky, so anything the browser scrolls into view (a Tab to
       the next link, a #anchor) would land underneath it. Keep a strip the
       height of the bar clear at the top (WCAG 2.4.11 Focus Not Obscured). */
    'html{scroll-padding-top:4.5rem;}',
    /* skip link: off-screen until it receives keyboard focus */
    ".psd-skip{position:absolute;left:.75rem;top:-3rem;z-index:2000;padding:.5rem 1rem;border-radius:.5rem;background:#FDB913;",
      "color:#0B0E14;font-family:'Rajdhani',sans-serif;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:.8rem;text-decoration:none;}",
    '.psd-skip:focus{top:.6rem;}',
    /* the accessibility link at the foot of every page */
    ".psd-footer{border-top:1px solid rgba(255,255,255,.1);padding:1.5rem 1rem 2rem;text-align:center;font-family:'Rajdhani',sans-serif;",
      'font-weight:700;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;}',
    '.psd-a11y-line{margin:.6rem 0 0;}',
    ".psd-a11y-link{color:#FFD166!important;text-decoration:underline;font-family:'Rajdhani',sans-serif;font-weight:700;",
      'letter-spacing:.12em;text-transform:uppercase;font-size:.75rem;}',
    '.psd-a11y-link:hover{color:#fff!important;}',
    '.psd-a11y-link:focus-visible{outline:2px solid #FFD166;outline-offset:2px;}',
    '@media print{.psd-footer{display:none;}}',
    /* The full bar fits down to about 1150px with the registration pill, the
       three sitewide pills (Champions, In the News, Games), the pause button
       and the "Aa" button in it. The drawer takes over below 1180, which
       leaves room for a Windows scrollbar. Larger text or the readable font
       widen the bar past any fixed number, so fitBar() also switches to the
       drawer (.nav-compact) whenever the bar's contents would overflow it. */
    '@media(max-width:1180px){#psd-nav .nav-links,#psd-nav .nav-right,#psd-nav .nav-promo{display:none;}#psd-nav .nav-hamburger{display:flex;}}',
    '#psd-nav.nav-compact .nav-links,#psd-nav.nav-compact .nav-right,#psd-nav.nav-compact .nav-promo{display:none;}',
    '#psd-nav.nav-compact .nav-hamburger{display:flex;}',
    '@media print{#psd-nav,#psd-nav-drawer{display:none!important;}}'
  ].join('');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Current page path, normalised so "/smash/" and "/smash/index.html" match. */
  function here() {
    var p = location.pathname.replace(/\/+$/, '');
    if (!/\.html$/.test(p)) p += '/index.html';
    return p.toLowerCase();
  }

  function isActive(href) { return here() === href.toLowerCase(); }

  function sectionOf(sectionId) {
    return SECTIONS.filter(function (s) { return s.id === sectionId; })[0] || null;
  }

  /** Which section owns this page, from its own links — no per-page wiring. */
  function detectSection() {
    var found = null;
    SECTIONS.forEach(function (s) {
      s.groups.forEach(function (g) {
        g.links.forEach(function (l) { if (!found && isActive(l.href)) found = s; });
      });
    });
    return found;
  }

  function render(currentId) {
    var current = sectionOf(currentId) || detectSection();

    /* A hidden section is only ever shown to someone already in it. */
    var shown = SECTIONS.filter(function (s) {
      return !s.hidden || (current && s.id === current.id);
    });

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var items = shown.map(function (s) {
      var isCur = current && s.id === current.id;
      var dd = s.groups.map(function (g) {
        return '<div class="dd-header">' + esc(g.label) + '</div>' +
          g.links.map(function (l) {
            return '<a href="' + esc(l.href) + '"' + out(l) +
                   (isActive(l.href) ? ' class="active"' : '') +
                   ' style="--grp:' + esc(g.accent) + '">' +
                   '<span class="dd-dot" style="background:' + esc(g.accent) + '"></span>' +
                   esc(l.text) + '</a>';
          }).join('');
      }).join('');

      /* A real button that says whether its list is open. The list is plain
         links rather than an ARIA menu: role="menu" promises arrow-key
         behaviour that a list of links does not have. */
      return '<li class="nav-item' + (isCur ? ' current' : '') + '" style="--sect:' + esc(s.accent) + '">' +
               '<button type="button" class="nav-link" aria-expanded="false" aria-controls="psd-dd-' + esc(s.id) + '">' +
                 '<span aria-hidden="true">' + s.icon + '</span>' + esc(s.name) +
                 ' <span class="nav-chevron" aria-hidden="true">▼</span>' +
               '</button>' +
               '<div class="nav-dropdown" id="psd-dd-' + esc(s.id) + '">' + dd + '</div>' +
             '</li>';
    }).join('');

    var pills = SITEWIDE.map(function (l) {
      return '<a href="' + esc(l.href) + '"' + out(l) + ' class="nav-pill ' + esc(l.cls || '') +
             (isActive(l.href) ? ' active' : '') + '"' + (isActive(l.href) ? ' aria-current="page"' : '') + '>' +
             withIcon(l.text) + '</a>';
    }).join('');

    var motionBtn = '<button type="button" class="nav-motion" id="psd-motion" aria-pressed="false">' +
                      '<span aria-hidden="true"></span></button>';

    var displayBtn = '<div class="nav-display">' +
                       '<button type="button" class="nav-motion nav-aa" id="psd-display-btn" aria-expanded="false" ' +
                         'aria-controls="psd-display" aria-label="Display settings" title="Display settings">' +
                         '<span aria-hidden="true">Aa</span></button>' +
                       '<div class="psd-display" id="psd-display" role="group" aria-labelledby="psd-bar-display-title" hidden>' +
                         displayControls('bar') + '</div>' +
                     '</div>';

    var nav = document.createElement('nav');
    nav.id = 'psd-nav';
    nav.setAttribute('aria-label', 'Site navigation');
    var promo = PROMO
      ? '<a href="' + esc(PROMO.href) + '"' + out(PROMO) + ' class="nav-pill pill-register nav-promo">' +
          withIcon(PROMO.text) + '</a>'
      : '';

    nav.innerHTML =
      '<div class="nav-inner' + (PROMO ? ' has-promo' : '') + '">' +
        '<div class="nav-left">' +
          '<a href="/" class="nav-brand"><img src="/logos/psd-esports.png" alt="" class="nav-logo">PSD <span>Esports</span></a>' +
          '<ul class="nav-links" role="list">' + items + '</ul>' +
        '</div>' +
        promo +
        '<div class="nav-end">' +
          '<div class="nav-right">' + pills + motionBtn + displayBtn + '</div>' +
          '<button type="button" class="nav-hamburger" id="psd-hamburger" aria-label="Menu" aria-expanded="false" aria-controls="psd-nav-drawer">' +
            '<span></span><span></span><span></span>' +
          '</button>' +
        '</div>' +
      '</div>';

    /* The drawer gives each game a collapsible block. Only the block for the
       section this page is in starts open, so the menu opens short and the
       links you most likely want are already showing. An open sign-up goes
       straight under Home, so on a phone it is the first real thing in the menu. */
    var drawerInner = '<a href="/"' + (isActive('/index.html') ? ' class="active"' : '') + '>Home</a>' +
      (PROMO ? '<a href="' + esc(PROMO.href) + '"' + out(PROMO) + ' class="drawer-register">' +
                 withIcon(PROMO.text) + '</a>' : '') +
      shown.map(function (s) {
        var isCur = current && s.id === current.id;
        return '<details style="--sect:' + esc(s.accent) + '"' + (isCur ? ' open' : '') + '>' +
          '<summary><span aria-hidden="true">' + s.icon + '</span>' + esc(s.name) +
            '<span class="sum-chev" aria-hidden="true">▼</span></summary>' +
          '<div class="drawer-body">' +
          s.groups.map(function (g) {
            return '<div class="drawer-section">' + esc(g.label) + '</div>' +
              '<div class="drawer-chips">' +
              g.links.map(function (l) {
                return '<a href="' + esc(l.href) + '"' + out(l) + ' style="--grp:' + esc(g.accent) + '"' +
                       (isActive(l.href) ? ' class="active"' : '') + '>' + esc(l.text) + '</a>';
              }).join('') +
              '</div>';
          }).join('') +
          '</div></details>';
      }).join('') +
      '<div class="drawer-more"></div>' +
      SITEWIDE.map(function (l) {
        return '<a href="' + esc(l.href) + '"' + out(l) + (isActive(l.href) ? ' class="active" aria-current="page"' : '') + '>' +
               withIcon(l.text) + '</a>';
      }).join('') +
      '<a href="/accessibility.html"' + (isActive('/accessibility.html') ? ' class="active" aria-current="page"' : '') + '>Accessibility</a>' +
      '<button type="button" class="drawer-motion" id="psd-motion-drawer" aria-pressed="false"></button>' +
      '<details class="drawer-display"><summary><span aria-hidden="true">Aa</span>Display settings' +
        '<span class="sum-chev" aria-hidden="true">▼</span></summary>' +
        '<div class="pd-body">' + displayControls('drawer') + '</div></details>';

    var drawer = document.createElement('div');
    drawer.id = 'psd-nav-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = drawerInner;

    document.body.insertBefore(drawer, document.body.firstChild);
    document.body.insertBefore(nav, document.body.firstChild);

    var btn = document.getElementById('psd-hamburger');
    btn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
    });

    /* ---- game menus: hover, focus, tap and Escape ------------------------ */
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-item'), function (item) {
      var trigger = item.querySelector('.nav-link');
      function setOpen(open) {
        item.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', String(open));
      }
      item.addEventListener('mouseenter', function () { trigger.setAttribute('aria-expanded', 'true'); });
      item.addEventListener('mouseleave', function () {
        item.classList.remove('dismissed');
        if (!item.contains(document.activeElement)) setOpen(false);
      });
      item.addEventListener('focusin', function (e) {
        if (item.classList.contains('dismissed')) return;
        /* A mouse click also focuses the button; leave that to the click
           handler, or the menu would open on focus and shut on the click. */
        if (e.target === trigger && !keyboardFocus(trigger)) return;
        setOpen(true);
      });
      item.addEventListener('focusout', function (e) {
        if (!item.contains(e.relatedTarget)) { item.classList.remove('dismissed'); setOpen(false); }
      });
      trigger.addEventListener('click', function () {
        var open = !item.classList.contains('open') || item.classList.contains('dismissed');
        item.classList.remove('dismissed');
        setOpen(open);
        if (!open) item.classList.add('dismissed');
      });
      item.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        setOpen(false);
        item.classList.add('dismissed');
        trigger.focus();
      });
    });

    /* ---- pause animations ------------------------------------------------- */
    var motionBar = document.getElementById('psd-motion');
    var motionDrawer = document.getElementById('psd-motion-drawer');
    function paintMotion() {
      var still = isStill();
      var label = still ? 'Play animations' : 'Pause animations';
      motionBar.setAttribute('aria-pressed', String(still));
      motionBar.setAttribute('aria-label', 'Pause animations');
      motionBar.title = label;
      motionBar.firstChild.textContent = still ? '▶' : '❚❚';
      motionDrawer.setAttribute('aria-pressed', String(still));
      motionDrawer.textContent = still ? 'Animations paused · tap to play' : 'Pause animations';
      Array.prototype.forEach.call(document.querySelectorAll('[data-pref="motion"]'), function (c) { c.checked = still; });
    }
    [motionBar, motionDrawer].forEach(function (b) {
      b.addEventListener('click', function () { setStill(!isStill(), true); paintMotion(); });
    });

    /* ---- display settings ------------------------------------------------- */
    var displayWrap = nav.querySelector('.nav-display');
    var displayBtnEl = document.getElementById('psd-display-btn');
    var displayPanel = document.getElementById('psd-display');
    var prefInputs = document.querySelectorAll('[data-pref]');

    /* Both copies of the controls, and the pause buttons, always show the
       same state, whichever copy was used. */
    function paintPrefs() {
      Array.prototype.forEach.call(prefInputs, function (input) {
        var name = input.getAttribute('data-pref');
        input.checked = name === 'motion' ? isStill() : getPref(name) === input.value;
      });
    }
    function setPanel(open, refocus) {
      displayPanel.hidden = !open;
      displayBtnEl.setAttribute('aria-expanded', String(open));
      if (!open && refocus) displayBtnEl.focus();
    }
    displayBtnEl.addEventListener('click', function () { setPanel(displayPanel.hidden); });
    displayWrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !displayPanel.hidden) { e.stopPropagation(); setPanel(false, true); }
    });
    displayWrap.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !displayWrap.contains(e.relatedTarget)) setPanel(false);
    });
    document.addEventListener('click', function (e) {
      if (!displayPanel.hidden && !displayWrap.contains(e.target)) setPanel(false);
    });

    Array.prototype.forEach.call(prefInputs, function (input) {
      input.addEventListener('change', function () {
        var name = input.getAttribute('data-pref');
        if (name === 'motion') { setStill(input.checked, true); paintMotion(); }
        else if (input.checked) { setPref(name, input.value); fitBar(); }
        paintPrefs();
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.pd-reset'), function (b) {
      b.addEventListener('click', function () {
        Object.keys(PREFS).forEach(function (name) { setPref(name, PREFS[name].def); });
        /* back to whatever the device asks for, and forget the saved choice */
        try { localStorage.removeItem(MOTION_KEY); } catch (e) {}
        setStill(!!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches), false);
        paintMotion();
        paintPrefs();
        fitBar();
      });
    });

    /* Switch to the drawer whenever the bar's contents would run past its
       edge, which larger text and the wider readable font both cause. */
    var inner = nav.querySelector('.nav-inner');
    function fitBar() {
      nav.classList.remove('nav-compact');
      if (inner.scrollWidth > inner.clientWidth + 1) nav.classList.add('nav-compact');
    }
    window.addEventListener('resize', fitBar);
    /* the readable font arrives after first paint and widens the bar */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBar);
    document.fonts && document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', fitBar);

    paintMotion();
    paintPrefs();
    fitBar();

    addSkipLink();
    addAccessibilityLink();

    var onScroll = function () { nav.classList.toggle('nav-scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /**
   * The display settings controls. Drawn twice, in the bar's panel and in the
   * drawer, so `where` keeps their ids and radio groups apart.
   */
  function displayControls(where) {
    function group(name, legend, options) {
      return '<fieldset class="pd-set"><legend>' + esc(legend) + '</legend><div class="pd-opts">' +
        options.map(function (o) {
          return '<label class="pd-opt"><input type="radio" name="psd-' + where + '-' + name + '" value="' + esc(o[0]) +
                 '" data-pref="' + name + '">' + esc(o[1]) + '</label>';
        }).join('') + '</div></fieldset>';
    }
    return '<p class="pd-title" id="psd-' + where + '-display-title">Display settings</p>' +
      group('contrast', 'Contrast', [['standard', 'Standard'], ['high', 'High']]) +
      group('text', 'Text size', [['100', '100%'], ['125', '125%'], ['150', '150%']]) +
      group('font', 'Font', [['standard', 'Standard'], ['readable', 'Readable']]) +
      '<label class="pd-check"><input type="checkbox" data-pref="motion">Pause animations</label>' +
      '<button type="button" class="pd-reset">Reset to default</button>';
  }

  function keyboardFocus(el) {
    try { return el.matches(':focus-visible'); } catch (e) { return true; }
  }

  /* ---- skip link -----------------------------------------------------------

     The bar puts a dozen links in front of every page's content. A skip link,
     first in the page and shown when tabbed to, jumps straight past them
     (WCAG 2.4.1). Pages that already carry their own are left alone. The
     target is the page's <main>. */
  function addSkipLink() {
    /* A page's own skip link sits after this bar once the bar is inserted at
       the top, where it skips nothing; move it back in front. */
    var own = document.querySelector('.skip-link, .psd-skip');
    if (own) { document.body.insertBefore(own, document.body.firstChild); return; }
    var main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'main-content';
    /* focusable by script only, so the jump also moves keyboard focus */
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.style.outline = 'none';
    var a = document.createElement('a');
    a.className = 'psd-skip';
    a.href = '#' + main.id;
    a.textContent = 'Skip to main content';
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* ---- accessibility link ---------------------------------------------------

     The accessibility statement, with its contact for reporting a barrier, is
     linked at the foot of every page, in the same place each time (WCAG 3.2.6
     consistent help). A page with its own footer gets the link added to it; a
     page without one gets a small footer line. The finals stream pages are
     sized to the screen exactly, so a footer there would make them scroll. */
  function addAccessibilityLink() {
    if (document.querySelector('.fit')) return;
    var link = '<a class="psd-a11y-link" href="/accessibility.html">Accessibility</a>';
    var footers = document.querySelectorAll('body footer');
    var footer = footers[footers.length - 1];
    if (footer && !footer.closest('#sd')) {
      var line = document.createElement('p');
      line.className = 'psd-a11y-line';
      line.innerHTML = link;
      footer.appendChild(line);
    } else {
      var f = document.createElement('footer');
      f.className = 'psd-footer';
      f.innerHTML = 'PSD Esports &middot; Palmdale School District &middot; ' + link;
      document.body.appendChild(f);
    }
  }

  /* Tripwire for the duplicated registration details.
     On the four pages that load data/smash.js, check the nav agrees with it.
     Costs nothing, and it means the two copies can only drift apart for as long
     as it takes someone to open a Smash page with the console up. */
  function checkAgainstSmash() {
    var c = root.SMASH && root.SMASH.config;
    if (!c || !root.console || !console.warn) return;
    if (c.registerUrl && c.registerUrl !== REGISTRATION.url) {
      console.warn('[nav] registration URL disagrees with data/smash.js:',
                   REGISTRATION.url, 'vs', c.registerUrl);
    }
    if (c.registerBy && c.registerBy !== REGISTRATION.closes) {
      console.warn('[nav] registration deadline disagrees with data/smash.js:',
                   REGISTRATION.closes, 'vs', c.registerBy);
    }
  }

  root.PSD_NAV = {
    sections: SECTIONS,
    render: render,
    registration: REGISTRATION,
    /** True while the visitor has animations paused. Pages with their own
        timers (countdowns, rotating cards) check this before moving, and can
        listen for the 'psd:motion' event to catch up when it changes. */
    still: isStill,
    /** Call with a section id, or leave empty to work it out from the URL. */
    init: function (id) {
      function go() { render(id); setTimeout(checkAgainstSmash, 0); }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', go);
      } else {
        go();
      }
    }
  };

})(window);
