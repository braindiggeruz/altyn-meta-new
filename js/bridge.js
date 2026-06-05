/* ALTYN bridge page
 * - Reads ?cta=hero|format|final (default: hero)
 * - Preserves fbclid + utm_* from URL/sessionStorage
 * - Fires Meta Pixel: TelegramOpenAttempt + Lead
 * - Logs click to /api/click (best-effort)
 * - Shows visible bridge UI (no cloaking) + auto-redirect after delay
 */
(function () {
  'use strict';

  var BOT = 'altyntherapybot';
  var ALLOWED_CTA = ['hero', 'format', 'final', 'footer'];
  var DEFAULT_CTA = 'hero';
  var REDIRECT_DELAY_MS = 1500;

  var qs = new URLSearchParams(window.location.search);

  var cta = (qs.get('cta') || DEFAULT_CTA).toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (ALLOWED_CTA.indexOf(cta) === -1) cta = DEFAULT_CTA;

  var startParam = 'src_meta_safe_' + cta;

  // Collect tracking from URL or sessionStorage
  var TRACK_KEYS = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var tracking = { cta: cta };
  TRACK_KEYS.forEach(function (k) {
    var v = qs.get(k);
    if (!v) {
      try { v = sessionStorage.getItem('alt_' + k) || ''; } catch (e) {}
    }
    if (v) tracking[k] = v;
  });

  // Update the fallback button with correct start_param
  var btn = document.getElementById('bridge-btn');
  var tgUrl = 'https://t.me/' + BOT + '?start=' + encodeURIComponent(startParam);
  if (btn) btn.setAttribute('href', tgUrl);

  // Fire Meta Pixel events
  function firePixel() {
    try {
      if (window.fbq) {
        window.fbq('trackCustom', 'TelegramOpenAttempt', {
          cta: cta,
          start_param: startParam,
          fbclid: tracking.fbclid || null,
          utm_source: tracking.utm_source || null,
          utm_medium: tracking.utm_medium || null,
          utm_campaign: tracking.utm_campaign || null
        });
        window.fbq('track', 'Lead', { content_name: 'telegram_bot_open', cta: cta });
      }
    } catch (e) {}
  }

  // Log to backend (best-effort, non-blocking)
  function logClick() {
    try {
      var apiBase = (window.__API_BASE__ || '');
      var payload = JSON.stringify({
        cta: cta,
        start_param: startParam,
        fbclid: tracking.fbclid || null,
        utm_source: tracking.utm_source || null,
        utm_medium: tracking.utm_medium || null,
        utm_campaign: tracking.utm_campaign || null,
        utm_content: tracking.utm_content || null,
        utm_term: tracking.utm_term || null,
        referrer: document.referrer || null,
        path: window.location.pathname + window.location.search
      });
      var url = (apiBase || '') + '/api/click';
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(function () {});
      }
    } catch (e) {}
  }

  firePixel();
  logClick();

  // Visible bridge then redirect (no instant cloaked redirect)
  setTimeout(function () {
    try { window.location.href = tgUrl; } catch (e) {}
  }, REDIRECT_DELAY_MS);
})();
