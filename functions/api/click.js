/**
 * Cloudflare Pages Function — POST /api/click
 *
 * Принимает JSON-payload c полями: cta, fbclid, utm_*, referrer, path.
 * Лог идёт в console.log → виден в Cloudflare dashboard → Pages → Functions logs.
 * Если нужна постоянная аналитика — подключить KV / Workers Analytics Engine /
 * Workers D1 binding позже (через wrangler.toml).
 *
 * Никакого хранения сырых IP. user-agent усекается до 400 символов.
 */
const ALLOWED_CTA = new Set(['hero', 'format', 'final', 'footer', 'contact']);

export async function onRequestPost({ request }) {
  let payload = {};
  try {
    payload = await request.json();
  } catch (_) {
    payload = {};
  }

  let cta = String(payload.cta || 'unknown').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!ALLOWED_CTA.has(cta)) cta = 'unknown';

  const ua = (request.headers.get('user-agent') || '').slice(0, 400);
  const ip = request.headers.get('cf-connecting-ip') || '';
  const country = request.cf && request.cf.country ? request.cf.country : null;

  // Hash IP (16 hex chars) — never store raw IP
  let ipHash = null;
  if (ip) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('altyn::' + ip));
    ipHash = Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const record = {
    ts: new Date().toISOString(),
    cta,
    start_param: typeof payload.start_param === 'string' ? payload.start_param.slice(0, 120) : null,
    fbclid: typeof payload.fbclid === 'string' ? payload.fbclid.slice(0, 512) : null,
    utm_source: typeof payload.utm_source === 'string' ? payload.utm_source.slice(0, 120) : null,
    utm_medium: typeof payload.utm_medium === 'string' ? payload.utm_medium.slice(0, 120) : null,
    utm_campaign: typeof payload.utm_campaign === 'string' ? payload.utm_campaign.slice(0, 180) : null,
    utm_content: typeof payload.utm_content === 'string' ? payload.utm_content.slice(0, 180) : null,
    utm_term: typeof payload.utm_term === 'string' ? payload.utm_term.slice(0, 120) : null,
    referrer: typeof payload.referrer === 'string' ? payload.referrer.slice(0, 500) : null,
    path: typeof payload.path === 'string' ? payload.path.slice(0, 500) : null,
    ua,
    ip_hash: ipHash,
    country,
  };

  console.log('altyn_click', JSON.stringify(record));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}

export async function onRequest({ request }) {
  // OPTIONS / GET → 405 except POST handled above
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400',
      },
    });
  }
  return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: { 'content-type': 'application/json' },
  });
}
