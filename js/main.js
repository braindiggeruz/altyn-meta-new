/* ALTYN microsite — main JS
 * Lightweight. No frameworks. Handles:
 *   - Footer year
 *   - CTA click → Meta Pixel CTA_Click event
 *   - Preserve fbclid + utm_* in bridge links
 */
(function () {
  'use strict';

  // Footer year
  var yEl = document.getElementById('year');
  if (yEl) yEl.textContent = String(new Date().getFullYear());

  // Read incoming tracking params and forward them to every /go/telegram link
  var incoming = new URLSearchParams(window.location.search);
  var TRACK_KEYS = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var carry = {};
  TRACK_KEYS.forEach(function (k) {
    var v = incoming.get(k);
    if (v) {
      carry[k] = v;
      try { sessionStorage.setItem('alt_' + k, v); } catch (e) {}
    } else {
      try {
        var s = sessionStorage.getItem('alt_' + k);
        if (s) carry[k] = s;
      } catch (e) {}
    }
  });

  function buildBridgeUrl(href) {
    try {
      var u = new URL(href, window.location.origin);
      Object.keys(carry).forEach(function (k) {
        if (!u.searchParams.has(k)) u.searchParams.set(k, carry[k]);
      });
      return u.pathname + (u.search ? u.search : '');
    } catch (e) {
      return href;
    }
  }

  var ctaLinks = document.querySelectorAll('a[data-cta]');
  ctaLinks.forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.indexOf('/go/telegram') === 0 || href.indexOf('/go/telegram') !== -1) {
      a.setAttribute('href', buildBridgeUrl(href));
    }
    a.addEventListener('click', function () {
      var cta = a.getAttribute('data-cta') || 'unknown';
      try {
        if (window.fbq) {
          window.fbq('trackCustom', 'CTA_Click', { cta: cta });
        }
      } catch (e) {}
    });
  });
})();
