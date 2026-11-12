// Server-side only. Never import this file from a client component.
const PUSHY_URL = 'https://api.pushy.me/push';

/** Send a Web Push through Pushy. `data` = { title, message, url, ... } */
export async function pushyPush(tokens, data, platform = 'web') {
  // The Web app and the Android app are two separate Pushy apps, each with its own secret key.
  const key = platform === 'android' ? process.env.PUSHY_ANDROID_SECRET_API_KEY : process.env.PUSHY_SECRET_API_KEY;
  if (!key) return { ok: false, status: 500, error: (platform === 'android' ? 'PUSHY_ANDROID_SECRET_API_KEY' : 'PUSHY_SECRET_API_KEY') + ' is not set' };
  const to = (Array.isArray(tokens) ? tokens : []).filter((t) => typeof t === 'string' && t.length > 10).slice(0, 1000);
  if (!to.length) return { ok: false, status: 400, error: 'no device tokens' };

  const res = await fetch(`${PUSHY_URL}?api_key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, data, time_to_live: 86400 }),
    cache: 'no-store',
  });
  let j = null;
  try { j = await res.json(); } catch {}
  return { ok: res.ok && !!(j && j.success), status: res.status, error: j && j.error ? String(j.error) : null };
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
