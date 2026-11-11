'use client';
import { useCallback, useEffect, useState } from 'react';
import { isIOS, isStandalone } from '@/lib/push';

/* "Download App" logic for the admin PWA.
   The browser's install event is captured early by the inline script in layout.jsx (window.__bip). */

async function diagnose() {
  const rows = [];
  const add = (ok, title, fix) => rows.push({ ok, title, fix });
  const ua = navigator.userAgent;

  add(window.isSecureContext, 'Secure (HTTPS) link', 'Open the site with https:// in Chrome.');
  add(!/; wv\)|FBAN|FBAV|Instagram|WhatsApp|Line\/|Telegram|GSA\//i.test(ua), 'Opened in Chrome / Safari',
    'This looks like an in-app browser (WhatsApp, Instagram etc.). Copy the link and open it in Chrome.');

  let sw = false;
  try { sw = !!(await navigator.serviceWorker.getRegistration('/')); } catch {}
  add(sw, 'Service worker active', 'Reload this page once, then tap Download App again.');

  let mf = false;
  try {
    const l = document.querySelector('link[rel="manifest"]');
    const r = await fetch(l.href);
    const j = await r.json();
    mf = r.ok && Array.isArray(j.icons) && j.icons.length >= 2;
  } catch {}
  add(mf, 'App manifest + icons', 'The manifest or icons did not load. Redeploy the site and reload.');

  add(!!window.__bip, 'Install prompt available',
    'If everything above is OK, open the Chrome menu (⋮) and choose "Install app". If the app is already installed, open it from your home screen.');
  return rows;
}

function useInstall() {
  const [standalone, setStandalone] = useState(true); // hidden until we know
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState(null); // null | {type:'ios'} | {type:'check', rows}
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    const f = () => {
      setReady(!!window.__bip);
      if (window.__installed) setStandalone(true);
    };
    f();
    window.addEventListener('bip-ready', f);
    return () => window.removeEventListener('bip-ready', f);
  }, []);

  const install = useCallback(async () => {
    const run = async () => {
      const e = window.__bip;
      if (e) {
        e.prompt();
        const { outcome } = await e.userChoice;
        window.__bip = null;
        setReady(false);
        if (outcome === 'accepted') setStandalone(true);
        return true;
      }
      return false;
    };
    if (await run()) return;
    if (isIOS()) { setPanel({ type: 'ios' }); return; }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1200)); // the prompt can arrive a moment late
    if (await run()) { setBusy(false); return; }
    const rows = await diagnose();
    setBusy(false);
    setPanel({ type: 'check', rows });
  }, []);

  return { standalone, ready, panel, setPanel, install, busy };
}

function Panel({ panel, onClose }) {
  if (!panel) return null;
  return (
    <div className="a-ipanel" role="dialog">
      <button className="x" onClick={onClose} aria-label="Close">×</button>
      {panel.type === 'ios' ? (
        <>
          <b>Install on iPhone</b>
          <ol>
            <li>Open this page in <b>Safari</b>.</li>
            <li>Tap the <b>Share</b> button.</li>
            <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            <li>Open the app from your home screen and allow notifications.</li>
          </ol>
        </>
      ) : (
        <>
          <b>Why can’t I install yet?</b>
          <ul>
            {panel.rows.map((r) => (
              <li key={r.title} className={r.ok ? 'ok' : 'bad'}>
                <span>{r.ok ? '✓' : '✗'} {r.title}</span>
                {r.ok ? null : <small>{r.fix}</small>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Fixed bar at the very top of the login page. */
export function InstallBar() {
  const { standalone, panel, setPanel, install, busy } = useInstall();
  if (standalone) return null;
  return (
    <div className="a-ibar">
      <div className="in">
        <img src="/icons/icon-192.png" alt="" width="36" height="36" />
        <div className="t"><b>Sahchari Masale Admin</b><small>Install the app · get order alerts</small></div>
        <button className="a-btn gold sm" onClick={install} disabled={busy}>{busy ? 'Checking…' : 'Download App'}</button>
      </div>
      <Panel panel={panel} onClose={() => setPanel(null)} />
    </div>
  );
}

/** Small button for the admin sidebar. */
export function InstallButton() {
  const { standalone, panel, setPanel, install, busy } = useInstall();
  if (standalone) return null;
  return (
    <>
      <button onClick={install} disabled={busy}>{busy ? 'Checking…' : '⬇ Download App'}</button>
      <Panel panel={panel} onClose={() => setPanel(null)} />
    </>
  );
}
