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

      /* Not announced yet. A hidden section is left out of the nav on every
         other page, so a visitor to the site never sees it — but it still
         appears while you are inside it, so anyone with the direct link can
         move between its pages and get back out to the rest of the site.
         Delete this line to announce it. */
      hidden: true,

      groups: [
        {
          label: 'One-Day Tournament',
          accent: '#FDB913',
          links: [
            { text: 'Grade 5 & Under', href: '/smash/grade-5-under.html' },
            { text: 'Grades 6–8',      href: '/smash/grades-6-8.html' },
            { text: 'Rules',           href: '/smash/rules.html' }
          ]
        }
      ]
    }
  ];

  /* Links that belong to the whole site rather than any one title. */
  var SITEWIDE = [
    { text: '🏅 Champions', href: '/champions.html', cls: 'pill-champs' },
    { text: '📰 In the News', href: '/media.html' }
  ];

  var CSS = [
    '#psd-nav{position:sticky;top:0;z-index:1000;background:rgba(13,17,25,.82);backdrop-filter:blur(14px);',
      '-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08);',
      "font-family:'Rajdhani',sans-serif;transition:background .3s,box-shadow .3s,border-color .3s;}",
    '#psd-nav.nav-scrolled{background:rgba(9,12,18,.92);box-shadow:0 4px 32px rgba(0,0,0,.6);border-bottom-color:rgba(255,255,255,.05);}',
    '#psd-nav.nav-scrolled .nav-inner{height:42px;}',
    '#psd-nav.nav-scrolled .nav-link{height:42px;}',
    '#psd-nav .nav-inner{max-width:1280px;margin:0 auto;padding:0 1.25rem;display:flex;align-items:center;height:52px;transition:height .3s cubic-bezier(.4,0,.2,1);}',
    '#psd-nav .nav-brand{font-weight:900;font-size:1.1rem;letter-spacing:.08em;text-transform:uppercase;color:#fff;',
      'text-decoration:none;white-space:nowrap;display:flex;align-items:center;gap:.5rem;margin-right:1.5rem;}',
    '#psd-nav .nav-brand span{background:linear-gradient(90deg,#FF6B6B,#FFD166,#4DABF7,#FF6B6B);background-size:250% auto;',
      '-webkit-background-clip:text;background-clip:text;color:transparent;animation:brand-shift 5s linear infinite;}',
    '@keyframes brand-shift{to{background-position:250% center}}',
    '#psd-nav .nav-links{display:flex;align-items:center;gap:.15rem;list-style:none;margin:0;padding:0;flex:1;}',
    '#psd-nav .nav-item{position:relative;}',
    '#psd-nav .nav-link{display:flex;align-items:center;gap:.4rem;padding:.4rem .85rem;font-weight:700;font-size:.8rem;',
      'letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;text-decoration:none;border-radius:6px 6px 0 0;',
      'transition:color .15s,background .15s;white-space:nowrap;cursor:pointer;background:none;border:none;height:52px;}',
    '#psd-nav .nav-link:hover{color:#fff;background:rgba(255,255,255,.06);}',
    /* the section this page belongs to */
    '#psd-nav .nav-item.current .nav-link{color:#fff;background:rgba(255,255,255,.06);border-bottom:2px solid var(--sect,#FDB913);}',
    '#psd-nav .nav-chevron{font-size:.5rem;opacity:.55;transition:transform .2s;}',
    '#psd-nav .nav-item:hover .nav-chevron{transform:rotate(180deg);}',
    '#psd-nav .nav-dropdown{display:none;position:absolute;top:100%;left:0;min-width:225px;background:#151B26;',
      'border:1px solid rgba(255,255,255,.1);border-radius:0 8px 8px 8px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.8);}',
    '#psd-nav .nav-item:hover .nav-dropdown,#psd-nav .nav-item:focus-within .nav-dropdown{display:block;}',
    '#psd-nav .nav-dropdown a{display:flex;align-items:center;gap:.5rem;padding:.55rem 1rem;font-weight:700;font-size:.76rem;',
      'letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;text-decoration:none;transition:color .15s,background .15s;}',
    '#psd-nav .nav-dropdown a:hover{color:#fff;background:rgba(255,255,255,.07);}',
    '#psd-nav .nav-dropdown a.active{color:#fff;background:rgba(255,255,255,.07);border-left:3px solid var(--grp,#4DABF7);padding-left:calc(1rem - 3px);}',
    '#psd-nav .dd-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}',
    "#psd-nav .dd-header{padding:.5rem 1rem .25rem;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.58rem;",
      'letter-spacing:.2em;text-transform:uppercase;color:#4b5563;border-top:1px solid rgba(255,255,255,.06);}',
    '#psd-nav .dd-header:first-child{border-top:none;}',
    '#psd-nav .nav-right{margin-left:auto;display:flex;align-items:center;gap:.5rem;}',
    '#psd-nav .nav-pill{padding:.3rem .9rem;font-weight:700;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;',
      'border-radius:9999px;text-decoration:none;white-space:nowrap;transition:background .15s,border-color .15s;}',
    '#psd-nav .pill-champs{background:rgba(255,215,0,.1);color:#FFD166;border:1px solid rgba(255,215,0,.22);}',
    '#psd-nav .pill-champs:hover,#psd-nav .pill-champs.active{background:rgba(255,215,0,.22);border-color:rgba(255,215,0,.5);}',
    '#psd-nav .nav-hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:.5rem;background:none;border:none;margin-left:auto;}',
    '#psd-nav .nav-hamburger span{display:block;width:22px;height:2px;background:#9ca3af;border-radius:2px;transition:all .25s;}',
    '#psd-nav .nav-hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}',
    '#psd-nav .nav-hamburger.open span:nth-child(2){opacity:0;}',
    '#psd-nav .nav-hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}',
    '#psd-nav-drawer{display:none;background:#0d1119;border-bottom:1px solid rgba(255,255,255,.08);padding:.75rem 1.25rem 1rem;}',
    '#psd-nav-drawer.open{display:block;}',
    "#psd-nav-drawer a{display:block;padding:.5rem .75rem;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.88rem;",
      'letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;text-decoration:none;border-radius:6px;}',
    '#psd-nav-drawer a:hover,#psd-nav-drawer a.active{color:#fff;background:rgba(255,255,255,.06);}',
    "#psd-nav-drawer .drawer-section{font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:#4b5563;",
      "font-family:'Rajdhani',sans-serif;font-weight:700;padding:.5rem .75rem .2rem;margin-top:.4rem;}",
    '#psd-nav-drawer .drawer-title{font-size:.72rem;letter-spacing:.16em;color:#e5e7eb;padding:.6rem .75rem .2rem;margin-top:.6rem;',
      'border-top:1px solid rgba(255,255,255,.07);}',
    '#psd-nav-drawer .drawer-indent{padding-left:1.5rem;}',
    '@media(max-width:900px){#psd-nav .nav-links,#psd-nav .nav-right{display:none;}#psd-nav .nav-hamburger{display:flex;}}',
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
            return '<a href="' + esc(l.href) + '"' + (isActive(l.href) ? ' class="active"' : '') +
                   ' style="--grp:' + esc(g.accent) + '">' +
                   '<span class="dd-dot" style="background:' + esc(g.accent) + '"></span>' +
                   esc(l.text) + '</a>';
          }).join('');
      }).join('');

      return '<li class="nav-item' + (isCur ? ' current' : '') + '" style="--sect:' + esc(s.accent) + '">' +
               '<span class="nav-link" tabindex="0" role="button" aria-haspopup="true">' +
                 '<span aria-hidden="true">' + s.icon + '</span>' + esc(s.name) +
                 ' <span class="nav-chevron">▼</span>' +
               '</span>' +
               '<div class="nav-dropdown" role="menu">' + dd + '</div>' +
             '</li>';
    }).join('');

    var pills = SITEWIDE.map(function (l) {
      return '<a href="' + esc(l.href) + '" class="nav-pill ' + esc(l.cls || '') +
             (isActive(l.href) ? ' active' : '') + '">' + esc(l.text) + '</a>';
    }).join('');

    var nav = document.createElement('nav');
    nav.id = 'psd-nav';
    nav.setAttribute('aria-label', 'Site navigation');
    nav.innerHTML =
      '<div class="nav-inner">' +
        '<a href="/index.html" class="nav-brand">PSD <span>Esports</span></a>' +
        '<ul class="nav-links" role="list">' + items + '</ul>' +
        '<div class="nav-right">' + pills + '</div>' +
        '<button class="nav-hamburger" id="psd-hamburger" aria-label="Toggle navigation" aria-expanded="false">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>';

    /* The drawer lists every section in full — on a phone there is no hover,
       and burying the other titles behind a second tap helps nobody. */
    var drawerInner = '<a href="/index.html"' + (isActive('/index.html') ? ' class="active"' : '') + '>Home</a>' +
      shown.map(function (s) {
        return '<div class="drawer-section drawer-title">' + s.icon + ' ' + esc(s.name) + '</div>' +
          s.groups.map(function (g) {
            return '<div class="drawer-section">' + esc(g.label) + '</div>' +
              g.links.map(function (l) {
                return '<a href="' + esc(l.href) + '" class="drawer-indent' +
                       (isActive(l.href) ? ' active' : '') + '">' + esc(l.text) + '</a>';
              }).join('');
          }).join('');
      }).join('') +
      '<div class="drawer-section drawer-title">More</div>' +
      SITEWIDE.map(function (l) {
        return '<a href="' + esc(l.href) + '"' + (isActive(l.href) ? ' class="active"' : '') + '>' +
               esc(l.text) + '</a>';
      }).join('');

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

    var onScroll = function () { nav.classList.toggle('nav-scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  root.PSD_NAV = {
    sections: SECTIONS,
    render: render,
    /** Call with a section id, or leave empty to work it out from the URL. */
    init: function (id) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { render(id); });
      } else {
        render(id);
      }
    }
  };

})(window);
