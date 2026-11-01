'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRows, money } from '@/lib/admin';
import { Loading, Err, Empty, Modal, Field, Toggle, Ico, useUI } from '../ui';

const blank = { code: '', title: '', description: '', discount_type: 'percent', value: '', max_discount: '', min_order: '', category_id: '', is_public: true, is_active: true, expires_at: '' };
const label = (c) => (c.discount_type === 'ship' ? 'Free delivery' : c.discount_type === 'flat' ? `Flat ${money(c.value)} off` : `${c.value}% off${c.max_discount ? ' up to ' + money(c.max_discount) : ''}`);
const toLocal = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

export default function Coupons() {
  const { toast, confirm } = useUI();
  const { rows, err, reload } = useRows(() => supabase.from('coupons').select('*').order('id', { ascending: false }));
  const cats = useRows(() => supabase.from('categories').select('id,name').order('sort_order'));
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!rows || !cats.rows) return <Loading />;
  const cname = (id) => (cats.rows.find((c) => c.id === id) || {}).name;

  const save = async () => {
    const code = f.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!code) return toast('Coupon code is required', 'err');
    if (f.discount_type !== 'ship' && !(Number(f.value) > 0)) return toast('Enter the discount value', 'err');
    if (f.discount_type === 'percent' && Number(f.value) > 100) return toast('Percent cannot be above 100', 'err');
    setBusy(true);
    const row = {
      code, discount_type: f.discount_type, value: f.discount_type === 'ship' ? 0 : Number(f.value),
      max_discount: f.discount_type === 'percent' && Number(f.max_discount) > 0 ? Number(f.max_discount) : null,
      min_order: Number(f.min_order) || 0, category_id: f.category_id ? Number(f.category_id) : null,
      is_public: !!f.is_public, is_active: !!f.is_active,
      expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
    };
    row.title = f.title.trim() || label(row);
    const cn = row.category_id ? cname(row.category_id) : '';
    row.description = f.description.trim() || (`Minimum order ${money(row.min_order)}` + (cn ? ` of ${cn}` : ''));
    const { error } = await (f.id ? supabase.from('coupons').update(row).eq('id', f.id) : supabase.from('coupons').insert(row));
    setBusy(false);
    if (error) return toast(/duplicate|unique/i.test(error.message) ? 'This coupon code already exists' : error.message, 'err');
    toast('Coupon saved');
    setF(null);
    reload();
  };
  const toggle = async (c) => {
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) return toast(error.message, 'err');
    reload();
  };
  const del = async (c) => {
    if (!(await confirm(`Delete coupon ${c.code}?`))) return;
    const { error } = await supabase.from('coupons').delete().eq('id', c.id);
    if (error) return toast(error.message, 'err');
    toast('Coupon deleted');
    reload();
  };

  return (
    <>
      <Err msg={err} />
      <div className="a-row sb" style={{ marginBottom: 14 }}>
        <p className="a-sub" style={{ margin: 0 }}>Public coupons are listed at checkout. Hidden ones work only if the customer types the code.</p>
        <button className="a-btn" onClick={() => setF({ ...blank })}><Ico n="plus" size={16} />Add coupon</button>
      </div>
      {rows.length ? rows.map((c) => {
        const expired = c.expires_at && new Date(c.expires_at) < new Date();
        return (
          <div className="a-item" key={c.id}>
            <div className="a-grow">
              <h4>{c.code} <span className="a-badge b">{label(c)}</span></h4>
              <small>Min order {money(c.min_order)}{c.category_id ? ' · only ' + (cname(c.category_id) || 'category') : ''}{c.expires_at ? ' · till ' + new Date(c.expires_at).toLocaleDateString('en-IN') : ''}</small>
              <div className="a-row" style={{ gap: 5, marginTop: 4 }}>
                <span className={'a-badge ' + (c.is_active && !expired ? 'g' : 'r')}>{expired ? 'Expired' : c.is_active ? 'Active' : 'Off'}</span>
                <span className="a-badge">{c.is_public ? 'Public' : 'Hidden code'}</span>
              </div>
            </div>
            <div className="a-acts">
              <button className="a-btn sm ghost" onClick={() => toggle(c)}>{c.is_active ? 'Turn off' : 'Turn on'}</button>
              <button className="a-btn sm" onClick={() => setF({ ...c, value: c.value || '', max_discount: c.max_discount || '', min_order: c.min_order || '', category_id: c.category_id || '', expires_at: toLocal(c.expires_at) })}>Edit</button>
              <button className="a-ico" onClick={() => del(c)} aria-label="Delete"><Ico n="trash" size={15} /></button>
            </div>
          </div>
        );
      }) : <Empty title="No coupons" text="Create a coupon to give discounts. There are no demo coupons." />}

      {f ? (
        <Modal title={f.id ? 'Edit coupon' : 'New coupon'} onClose={() => setF(null)}
          footer={<><button className="a-btn ghost" onClick={() => setF(null)}>Cancel</button><button className="a-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save coupon'}</button></>}>
          <Field label="Coupon code"><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" autoCapitalize="characters" /></Field>
          <Field label="Discount type">
            <select value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value })}>
              <option value="percent">Percent off (%)</option>
              <option value="flat">Flat ₹ off</option>
              <option value="ship">Free delivery</option>
            </select>
          </Field>
          {f.discount_type !== 'ship' ? (
            <div className="a-grid c2">
              <Field label={f.discount_type === 'percent' ? 'Percent %' : 'Amount ₹'}><input type="number" min="0" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
              {f.discount_type === 'percent' ? <Field label="Max discount ₹" hint="(optional)"><input type="number" min="0" value={f.max_discount} onChange={(e) => setF({ ...f, max_discount: e.target.value })} /></Field> : null}
            </div>
          ) : null}
          <div className="a-grid c2">
            <Field label="Minimum order ₹"><input type="number" min="0" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} /></Field>
            <Field label="Only for category" hint="(optional)">
              <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
                <option value="">All products</option>
                {cats.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Valid till" hint="(optional)"><input type="datetime-local" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} /></Field>
          <Field label="Title shown to customer" hint="(auto if empty)"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Small text" hint="(auto if empty)"><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div className="a-row" style={{ gap: 22 }}>
            <Toggle checked={f.is_public} onChange={(v) => setF({ ...f, is_public: v })} label={f.is_public ? 'Public (listed)' : 'Hidden code'} />
            <Toggle checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label={f.is_active ? 'Active' : 'Off'} />
          </div>
        </Modal>
      ) : null}
    </>
  );
}
