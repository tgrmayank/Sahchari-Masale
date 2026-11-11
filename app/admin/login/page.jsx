'use client';
import { useEffect, useState } from 'react';
import { supabase, configured } from '@/lib/supabase';
import logo from '../../logo.png';
import { InstallBar } from '../PwaInstall';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data && data.session) window.location.replace('/admin');
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!configured) return setErr('Supabase keys are missing. Fill the .env file and restart.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) {
      setBusy(false);
      return setErr(/invalid/i.test(error.message) ? 'Wrong email or password.' : error.message);
    }
    window.location.replace('/admin');
  };

  return (
    <div className="a-login">
      <InstallBar />
      <form className="a-lbox" onSubmit={submit}>
        <img className="lg" src={logo.src || logo} alt="" />
        <h1>Admin Login</h1>
        <p className="s">Sign in to manage your store</p>
        {err ? <div className="a-err">{err}</div> : null}
        <label className="a-f">
          <span>Email</span>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
        </label>
        <label className="a-f">
          <span>Password</span>
          <div className="a-pw">
            <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Your password" style={{ paddingRight: 64 }} />
            <button type="button" onClick={() => setShow((v) => !v)}>{show ? 'Hide' : 'Show'}</button>
          </div>
        </label>
        <button className="a-btn w" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        <p className="s" style={{ marginTop: 14, marginBottom: 0 }}><a href="/">← Back to website</a></p>
      </form>
    </div>
  );
}
