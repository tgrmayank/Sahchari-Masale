'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase, configured } from '@/lib/supabase';
import logo from '../logo.png';
import { UIProvider, Ico, Loading } from './ui';
import PushGate from './PushGate';
import { InstallButton } from './PwaInstall';
import { pushGranted, registerPush, unregisterPush, isStandalone } from '@/lib/push';
import Dashboard from './sections/Dashboard';
import Orders from './sections/Orders';
import Products from './sections/Products';
import Categories from './sections/Categories';
import Banners from './sections/Banners';
import Coupons from './sections/Coupons';
import Reviews from './sections/Reviews';
import Account from './sections/Account';
import { Delivery, StoreInfo, HomeContent, Policies } from './sections/Settings';

const NAV = [
  ['dashboard', 'Dashboard', 'home', Dashboard],
  ['orders', 'Orders', 'bag', Orders],
  ['products', 'Products', 'box', Products],
  ['categories', 'Categories', 'grid', Categories],
  ['banners', 'Home Banners', 'image', Banners],
  ['coupons', 'Coupons', 'tag', Coupons],
  ['reviews', 'Reviews', 'star', Reviews],
  ['sep', 'Store settings'],
  ['delivery', 'Delivery Charges', 'truck', Delivery],
  ['store', 'Store & Contact', 'shop', StoreInfo],
  ['content', 'Homepage Text', 'text', HomeContent],
  ['policies', 'Terms & Privacy', 'file', Policies],
  ['account', 'Email & Password', 'file', Account],
];

function Shell({ email, onLogout }) {
  const [sec, setSec] = useState('dashboard');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const f = () => {
      const h = window.location.hash.slice(1);
      if (NAV.some((n) => n[0] === h && n[0] !== 'sep')) setSec(h);
    };
    f();
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);

  const go = useCallback((id) => {
    window.location.hash = id;
    setSec(id);
    setOpen(false);
    const sc = document.querySelector('.adm');
    if (sc) sc.scrollTo(0, 0);
  }, []);

  const cur = NAV.find((n) => n[0] === sec) || NAV[0];
  const Page = cur[3];

  return (
    <div className="a-app">
      <aside className={'a-side' + (open ? ' open' : '')}>
        <div className="a-brand">
          <img src={logo.src || logo} alt="" />
          <div><b>Admin Panel</b><small>Store control</small></div>
        </div>
        <nav className="a-nav">
          {NAV.map((n) => n[0] === 'sep'
            ? <div className="sep" key="sep">{n[1]}</div>
            : <button key={n[0]} className={n[0] === sec ? 'on' : ''} onClick={() => go(n[0])}><Ico n={n[2]} />{n[1]}</button>)}
        </nav>
        <div className="a-side-f">
          <InstallButton />
          <a href="/" target="_blank" rel="noopener"><Ico n="globe" />View website</a>
          <button onClick={onLogout}><Ico n="out" />Logout</button>
        </div>
      </aside>
      <div className={'a-scrim' + (open ? ' open' : '')} onClick={() => setOpen(false)} />
      <div className="a-main">
        <header className="a-top">
          <button className="a-burger" onClick={() => setOpen(true)} aria-label="Menu"><Ico n="menu" size={24} /></button>
          <h2>{cur[1]}</h2>
          <span className="a-user">{email}</span>
        </header>
        <div className="a-page"><Page key={sec} go={go} /></div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [state, setState] = useState('load'); // load | ok | denied | nokeys
  const [email, setEmail] = useState('');
  const [push, setPush] = useState('check'); // check | need | ready

  const logout = useCallback(async () => {
    try { await unregisterPush(); } catch {}
    await supabase.auth.signOut();
    window.location.replace('/admin/login');
  }, []);

  useEffect(() => {
    if (!configured) { setState('nokeys'); return; }
    let off = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (off) return;
      if (!data.session) { window.location.replace('/admin/login'); return; }
      setEmail(data.session.user.email || '');
      const { data: ok, error } = await supabase.rpc('is_admin');
      if (off) return;
      setState(!error && ok === true ? 'ok' : 'denied');
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === 'SIGNED_OUT') window.location.replace('/admin/login');
    });
    return () => { off = true; sub.subscription.unsubscribe(); };
  }, []);

  // Once the admin is confirmed: this device must allow notifications before the panel opens.
  useEffect(() => {
    if (state !== 'ok') return;
    const granted = pushGranted();
    let skipped = false;
    try { skipped = sessionStorage.getItem('sm_push_skip') === '1'; } catch {}
    if (granted) {
      setPush('ready');
      registerPush().catch(() => {}); // silent refresh of the saved device token
    } else if (skipped && !isStandalone()) {
      setPush('ready');
    } else {
      setPush('need');
    }
  }, [state]);

  const skipPush = () => {
    try { sessionStorage.setItem('sm_push_skip', '1'); } catch {}
    setPush('ready');
  };

  if (state === 'load') return <div className="a-load"><span /></div>;
  if (state === 'nokeys') return (
    <div className="a-login"><div className="a-lbox"><h1>Setup needed</h1>
      <p className="s">Put your Supabase URL and anon key in the <b>.env</b> file, then restart the server.</p></div></div>
  );
  if (state === 'denied') return (
    <div className="a-login"><div className="a-lbox"><h1>No admin access</h1>
      <p className="s">{email} is not an admin. Add this email in the SQL file (admins table) and run it again.</p>
      <button className="a-btn w" onClick={logout}>Logout</button></div></div>
  );
  if (push === 'check') return <div className="a-load"><span /></div>;
  if (push === 'need') return <PushGate onDone={() => setPush('ready')} onSkip={skipPush} />;
  return <UIProvider><Shell email={email} onLogout={logout} /></UIProvider>;
}
