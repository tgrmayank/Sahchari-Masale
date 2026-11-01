'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRows, dt } from '@/lib/admin';
import { Loading, Err, Empty, Modal, Field, Ico, useUI } from '../ui';

export default function Reviews() {
  const { toast, confirm } = useUI();
  const { rows, err, reload } = useRows(() => supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(300));
  const prods = useRows(() => supabase.from('products').select('id,name').order('name'));
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!rows || !prods.rows) return <Loading />;
  const pname = (id) => (prods.rows.find((p) => p.id === id) || {}).name || 'Deleted product';

  const toggle = async (r) => {
    const { error } = await supabase.from('reviews').update({ is_approved: !r.is_approved }).eq('id', r.id);
    if (error) return toast(error.message, 'err');
    reload();
  };
  const del = async (r) => {
    if (!(await confirm('Delete this review?'))) return;
    const { error } = await supabase.from('reviews').delete().eq('id', r.id);
    if (error) return toast(error.message, 'err');
    reload();
  };
  const add = async () => {
    if (!f.product_id) return toast('Select a product', 'err');
    if (!f.name.trim()) return toast('Enter the customer name', 'err');
    setBusy(true);
    const { error } = await supabase.from('reviews').insert({ product_id: Number(f.product_id), name: f.name.trim(), rating: Number(f.rating), message: f.message.trim(), is_approved: true });
    setBusy(false);
    if (error) return toast(error.message, 'err');
    toast('Review added');
    setF(null);
    reload();
  };

  return (
    <>
      <Err msg={err} />
      <div className="a-row sb" style={{ marginBottom: 14 }}>
        <p className="a-sub" style={{ margin: 0 }}>Customers can review after delivery. Hide or delete anything you do not want shown.</p>
        <button className="a-btn" disabled={!prods.rows.length} onClick={() => setF({ product_id: '', name: '', rating: 5, message: '' })}><Ico n="plus" size={16} />Add review</button>
      </div>
      {rows.length ? rows.map((r) => (
        <div className="a-item" key={r.id}>
          <div className="a-grow">
            <h4>{r.name} <span style={{ color: '#d9a21b' }}>{'★'.repeat(r.rating)}</span><span style={{ color: '#d9cfbf' }}>{'★'.repeat(5 - r.rating)}</span></h4>
            <small>{pname(r.product_id)} · {dt(r.created_at)}{r.order_id ? ' · verified' : ''}</small>
            {r.message ? <p style={{ marginTop: 4 }}>{r.message}</p> : null}
          </div>
          <div className="a-acts">
            <span className={'a-badge ' + (r.is_approved ? 'g' : 'r')}>{r.is_approved ? 'Shown' : 'Hidden'}</span>
            <button className="a-btn sm ghost" onClick={() => toggle(r)}>{r.is_approved ? 'Hide' : 'Show'}</button>
            <button className="a-ico" onClick={() => del(r)} aria-label="Delete"><Ico n="trash" size={15} /></button>
          </div>
        </div>
      )) : <Empty title="No reviews yet" text="Reviews from customers will appear here." />}
      {f ? (
        <Modal title="Add review" onClose={() => setF(null)}
          footer={<><button className="a-btn ghost" onClick={() => setF(null)}>Cancel</button><button className="a-btn" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Add'}</button></>}>
          <Field label="Product">
            <select value={f.product_id} onChange={(e) => setF({ ...f, product_id: e.target.value })}>
              <option value="">— Select —</option>
              {prods.rows.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Customer name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Rating">
            <select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
          </Field>
          <Field label="Review"><textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
        </Modal>
      ) : null}
    </>
  );
}
