'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Field, useUI } from '../ui';

/* Admin login: change email and password */
export default function Account() {
  const { toast } = useUI();
  const [cur, setCur] = useState('');

  // email form
  const [newEmail, setNewEmail] = useState('');
  const [pwForEmail, setPwForEmail] = useState('');
  const [busyE, setBusyE] = useState(false);
  const [msgE, setMsgE] = useState('');

  // password form
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busyP, setBusyP] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCur((data && data.user && data.user.email) || ''));
  }, []);

  // confirm the current password before any change
  const verify = async (pw) => {
    const { error } = await supabase.auth.signInWithPassword({ email: cur, password: pw });
    if (error) throw new Error('Current password is wrong.');
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    setMsgE('');
    const em = newEmail.trim().toLowerCase();
    if (!em || em === cur.toLowerCase()) return toast('Enter a different email.', 'err');
    setBusyE(true);
    try {
      await verify(pwForEmail);
      const { error } = await supabase.auth.updateUser({ email: em });
      if (error) throw new Error(error.message);
      setMsgE(em);
      setPwForEmail('');
      toast('Confirmation link sent.');
    } catch (err) { toast(err.message, 'err'); }
    setBusyE(false);
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (newPw.length < 8) return toast('New password must be at least 8 characters.', 'err');
    if (newPw !== newPw2) return toast('Both new passwords must match.', 'err');
    if (newPw === oldPw) return toast('New password must be different.', 'err');
    setBusyP(true);
    try {
      await verify(oldPw);
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw new Error(error.message);
      setOldPw(''); setNewPw(''); setNewPw2('');
      toast('Password changed.');
    } catch (err) { toast(err.message, 'err'); }
    setBusyP(false);
  };

  const pwInput = (value, set, ph, ac) => (
    <input type={show ? 'text' : 'password'} required autoComplete={ac} value={value} placeholder={ph} onChange={(e) => set(e.target.value)} />
  );

  return (
    <>
      <div className="a-card">
        <h3>Change email</h3>
        <p className="a-sub">Current login email: <b>{cur || '…'}</b></p>
        {msgE ? (
          <div className="a-ok">
            A confirmation link was sent to <b>{msgE}</b> (and maybe to your old email too). Open the link(s) to finish.
            Then run this once in Supabase SQL Editor so the panel keeps working:
            <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', fontSize: 12 }}>{`update public.admins set email = '${msgE}' where email = '${cur}';`}</pre>
          </div>
        ) : null}
        <form onSubmit={changeEmail}>
          <Field label="New email"><input type="email" required autoComplete="off" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" /></Field>
          <Field label="Current password">{pwInput(pwForEmail, setPwForEmail, 'Your current password', 'current-password')}</Field>
          <button className="a-btn" disabled={busyE}>{busyE ? 'Sending…' : 'Change email'}</button>
        </form>
      </div>

      <div className="a-card">
        <h3>Change password</h3>
        <p className="a-sub">Use at least 8 characters.</p>
        <form onSubmit={changePw}>
          <Field label="Current password">{pwInput(oldPw, setOldPw, 'Your current password', 'current-password')}</Field>
          <div className="a-grid c2">
            <Field label="New password">{pwInput(newPw, setNewPw, 'New password', 'new-password')}</Field>
            <Field label="Confirm new password">{pwInput(newPw2, setNewPw2, 'Repeat new password', 'new-password')}</Field>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, margin: '4px 0 12px' }}>
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} style={{ width: 'auto' }} /> Show passwords
          </label>
          <button className="a-btn" disabled={busyP}>{busyP ? 'Saving…' : 'Change password'}</button>
        </form>
      </div>
    </>
  );
}
