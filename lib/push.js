// Browser-side helpers for admin push notifications (Pushy Web Push).
import { supabase } from './supabase';

export const PUSHY_APP_ID = process.env.NEXT_PUBLIC_PUSHY_APP_ID || '6af4c51bd819808c52e4feca';
const SDK_URL = 'https://sdk.pushy.me/web/1.0.24/pushy-sdk.js';
const KEY = 'sm_admin_push_token';

/** true inside the native Android app (WebView) - it exposes window.SMApp */
export const isApp = () => typeof window !== 'undefined' && !!window.SMApp;

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (isApp() || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export const savedToken = () => {
  if (isApp()) { try { return window.SMApp.getToken() || ''; } catch { return ''; } }
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
};

/** Are notifications already allowed on this device (and a token exists)? */
export function pushGranted() {
  if (typeof window === 'undefined') return false;
  if (isApp()) {
    try { return !!window.SMApp.notificationsEnabled() && !!window.SMApp.getToken(); } catch { return false; }
  }
  return typeof Notification !== 'undefined' && Notification.permission === 'granted' && !!savedToken();
}

export function pushSupport() {
  if (typeof window === 'undefined') return { ok: false, reason: '' };
  if (isApp()) return { ok: true, reason: '' };
  if (!window.isSecureContext) return { ok: false, reason: 'Open the site over HTTPS. Notifications do not work on plain http.' };
  if (isIOS() && !isStandalone()) {
    return { ok: false, reason: 'On iPhone, tap Share → Add to Home Screen first, then open the app from your home screen.' };
  }
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, reason: 'This browser does not support push notifications. Please use Chrome.' };
  }
  return { ok: true, reason: '' };
}

let sdkPromise = null;
export function loadSdk() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Pushy) return Promise.resolve(window.Pushy);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = () => (window.Pushy ? resolve(window.Pushy) : reject(new Error('Pushy SDK did not start.')));
      s.onerror = () => { sdkPromise = null; reject(new Error('Could not load the notification service. Check your internet or ad-blocker.')); };
      document.head.appendChild(s);
    });
  }
  return sdkPromise;
}

/** Ask permission (browser popup) + register this device + save the token for the admin. Call from a tap. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Native Android app: ask the app for its Pushy token (it registers itself in the background). */
async function registerApp() {
  const A = window.SMApp;
  try { A.requestPermission(); } catch {}
  let token = '';
  for (let i = 0; i < 40 && !token; i++) {           // wait up to ~20 s
    if (A.notificationsEnabled()) {
      try { token = A.getToken() || ''; } catch {}
      if (token) break;
      const err = A.getError ? A.getError() : '';
      if (err && i > 6) throw new Error('Could not register this phone: ' + err);
    }
    await sleep(500);
  }
  if (!A.notificationsEnabled()) {
    throw new Error('Notifications are turned off for this app. Allow them in the settings screen that opened, then come back and tap the button again.');
  }
  if (!token) throw new Error('Registration is taking too long. Check your internet and try again.');
  const { error } = await supabase.from('admin_push_tokens').upsert({
    token,
    platform: 'android',
    user_agent: String(navigator.userAgent || '').slice(0, 250),
    last_seen: new Date().toISOString(),
  });
  if (error) throw new Error('Could not save this device: ' + error.message + ' (did you run supabase-android-push.sql?)');
  return token;
}

export async function registerPush() {
  if (isApp()) return registerApp();
  const s = pushSupport();
  if (!s.ok) throw new Error(s.reason);
  if (Notification.permission === 'denied') {
    throw new Error('Notifications are blocked for this site. Open browser Settings → Site settings → Notifications, allow this site, then try again.');
  }
  const Pushy = await loadSdk();
  const token = await Pushy.register({ appId: PUSHY_APP_ID });
  const { error } = await supabase.from('admin_push_tokens').upsert({
    token,
    platform: 'web',
    user_agent: String(navigator.userAgent || '').slice(0, 250),
    last_seen: new Date().toISOString(),
  });
  if (error) throw new Error('Could not save this device: ' + error.message + ' (did you run supabase-push-setup.sql?)');
  try { localStorage.setItem(KEY, token); } catch {}
  return token;
}

/** Remove this device from the admin list (used on logout). */
export async function unregisterPush() {
  const t = savedToken();
  if (!t) return;
  try { await supabase.from('admin_push_tokens').delete().eq('token', t); } catch {}
  try { localStorage.removeItem(KEY); } catch {}
}

/** Send a test notification to this device (server checks that the caller is an admin). */
export async function sendTestPush(token) {
  const { data } = await supabase.auth.getSession();
  const jwt = data && data.session ? data.session.access_token : '';
  const r = await fetch('/api/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
    body: JSON.stringify({ token, platform: isApp() ? 'android' : 'web' }),
  });
  return r.ok;
}
