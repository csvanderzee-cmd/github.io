/* ==========================================================================
   PSD Esports — click an email address to copy it.

   Coaches mostly want the address to paste into whatever they already have
   open, not a mail client launching at them. Clicking any mailto link copies
   the address and says so.

   Include this on any page with contact links; it wires up every mailto on
   the page by itself, so a new one needs no extra code.

   The href is deliberately left intact. The link still means what it says, so
   right-click still offers "Copy email address" and "Open link", the address
   is still readable to a screen reader, and if this script fails to load the
   page degrades to an ordinary mailto rather than a dead link.
   ========================================================================== */

(function (root) {
  'use strict';

  var TOAST_MS = 1600;
  var toastEl = null, hideTimer = null;

  function injectCSS() {
    var css =
      '.psd-toast{position:fixed;z-index:3000;transform:translate(-50%,-100%);' +
        "background:#151B26;border:1px solid rgba(255,255,255,.16);color:#e5e7eb;" +
        "font-family:'Rajdhani',sans-serif;font-weight:800;font-size:.72rem;letter-spacing:.12em;" +
        'text-transform:uppercase;padding:.45rem .8rem;border-radius:9999px;white-space:nowrap;' +
        'box-shadow:0 8px 26px rgba(0,0,0,.55);pointer-events:none;opacity:0;' +
        'transition:opacity .16s ease,transform .16s ease;}' +
      '.psd-toast.show{opacity:1;transform:translate(-50%,calc(-100% - 8px));}' +
      '.psd-toast .tick{color:#34d399;margin-right:.35rem;}' +
      '@media print{.psd-toast{display:none!important;}}';
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function toast(text, x, y, ok) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'psd-toast';
      /* polite, not assertive: this is a confirmation, not an alarm */
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = (ok ? '<span class="tick">&#10003;</span>' : '') + text;
    toastEl.style.left = x + 'px';
    toastEl.style.top = y + 'px';

    /* restart the animation even on a rapid second click */
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');

    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { toastEl.classList.remove('show'); }, TOAST_MS);
  }

  /**
   * Copy text, resolving true on success.
   *
   * navigator.clipboard needs a secure context, so it is missing on plain
   * http. The textarea fallback is the old execCommand route, which still
   * works there and costs nothing to keep.
   */
  function copy(text) {
    if (root.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; },
                                                      function () { return legacy(text); });
    }
    return Promise.resolve(legacy(text));
  }

  function legacy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function addressOf(a) {
    var href = a.getAttribute('href') || '';
    return href.replace(/^mailto:/i, '').split('?')[0].trim();
  }

  function wire() {
    injectCSS();

    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="mailto:"]') : null;
      if (!a) return;

      /* let the browser do its normal thing for new-tab / modified clicks, so
         anyone who genuinely wants their mail client can still get there */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      var addr = addressOf(a);
      if (!addr) return;

      e.preventDefault();

      var r = a.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top;

      copy(addr).then(function (ok) {
        toast(ok ? 'Copied' : 'Press Ctrl+C to copy', x, y, ok);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

})(window);
