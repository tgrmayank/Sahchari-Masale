'use client';
import { useEffect, useState } from 'react';
import { isApp, isStandalone, loadSdk, pushSupport, registerPush, sendTestPush } from '@/lib/push';
import logo from '../logo.png';

/* Full-screen step shown BEFORE the admin panel until this device allows notifications. */
export default function PushGate({ onDone, onSkip }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [mustAllow, setMustAllow] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setMustAllow(isStandalone());
    setBlocked(typeof Notification !== 'undefined' && Notification.permission === 'denied');
    if (!isApp()) loadSdk().catch(() => {}); // preload so the popup opens instantly on tap
  }, []);

  const allow = async () => {
    setErr('');
    const s = pushSupport();
    if (!s.ok) return setErr(s.reason);
    setBusy(true);
    try {
      const token = await registerPush(); // shows the browser permission popup
      sendTestPush(token).catch(() => {});
      onDone();
    } catch (e) {
      setBlocked(typeof Notification !== 'undefined' && Notification.permission === 'denied');
      setErr(e && e.message ? e.message : 'Could not enable notifications.');
      setBusy(false);
    }
  };

  return (
    <div className="a-login">
      <div className="a-lbox a-gate">
        <img className="lg" src={logo.src || logo} alt="" />
        <div className="bell" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </div>
        <h1>Turn on notifications</h1>
        <p className="s">
          Get an instant alert on this phone for every new order, even when the app is closed.
          Tap the button and choose <b>Allow</b> in the popup.
        </p>
        {err ? <div className="a-err">{err}</div> : null}
        {blocked ? (
          <p className="s" style={{ marginBottom: 12 }}>
            Notifications are blocked. Open <b>Browser Settings → Site settings → Notifications</b>, allow this site, then come back and tap the button.
          </p>
        ) : null}
        <button className="a-btn w" onClick={allow} disabled={busy}>{busy ? 'Waiting for permission…' : 'Allow notifications'}</button>
        {!mustAllow ? (
          <p className="s" style={{ marginTop: 14, marginBottom: 0 }}>
            <a href="#skip" onClick={(e) => { e.preventDefault(); onSkip(); }}>Skip for now</a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
