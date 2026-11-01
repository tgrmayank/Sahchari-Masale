'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRows, reorder } from '@/lib/admin';
import { Loading, Err, Empty, Modal, Field, Toggle, ImageInput, Ico, useUI } from '../ui';

const blank = { title: '', subtitle: '', image_url: '', category_id: '', sort_order: 0, is_active: true };

export default function Banners() {
  const { toast, confirm } = useUI();
  const { rows, err, reload } = useRows(() => supabase.from('hero_slides').select('*').order('sort_order').order('id'));
  const cats = useRows(() => supabase.from('categories').select('id,name').order('sort_order'));
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!rows || !cats.rows) return <Loading />;

  const save = async () => {
    if (!f.image_url) return toast('Please upload a banner image', 'err');
    setBusy(true);
    const row = {
      title: f.title.trim(), subtitle: f.subtitle.trim(), image_url: f.image_url,
      category_id: f.category_id ? Number(f.category_id) : null,
      sort_order: Number(f.sort_order) || 0, is_active: !!f.is_active,
    };
    const q = f.id ? supabase.from('hero_slides').update(row).eq('id', f.id) : supabase.from('hero_slides').insert({ ...row, sort_order: row.sort_order || (rows.length + 1) * 10 });
    const { error } = await q;
    setBusy(false);
    if (error) return toast(error.message, 'err');
    toast('Banner saved');
    setF(null);
    reload();
  };
  const toggle = async (s) => {
    const { error } = await supabase.from('hero_slides').update({ is_active: !s.is_active }).eq('id', s.id);
    if (error) return toast(error.message, 'err');
    reload();
  };
  const del = async (s) => {
    if (!(await confirm('Delete this banner?'))) return;
    const { error } = await supabase.from('hero_slides').delete().eq('id', s.id);
    if (error) return toast(error.message, 'err');
    toast('Banner deleted');
    reload();
  };
  const move = async (i, d) => {
    const m = await reorder('hero_slides', rows, i, d);
    if (m) toast(m, 'err');
    reload();
  };
  const cname = (id) => (cats.rows.find((c) => c.id === id) || {}).name;

  return (
    <>
      <Err msg={err} />
      <div className="a-row sb" style={{ marginBottom: 14 }}>
        <p className="a-sub" style={{ margin: 0 }}>Big sliding banners at the top of your home page.</p>
        <button className="a-btn" onClick={() => setF({ ...blank })}><Ico n="plus" size={16} />Add banner</button>
      </div>
      {rows.length ? rows.map((s, i) => (
        <div className="a-item" key={s.id}>
          <div className="th wide" style={{ width: 130, height: 64 }}>{s.image_url ? <img src={s.image_url} alt="" /> : 'no image'}</div>
          <div className="a-grow">
            <h4>{s.title || 'Banner ' + (i + 1)}</h4>
            <small>{s.category_id ? 'Opens: ' + (cname(s.category_id) || '—') : 'No link'}</small>
            <span className={'a-badge ' + (s.is_active ? 'g' : 'r')}>{s.is_active ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="a-acts">
            <button className="a-ico" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Up"><Ico n="up" size={15} /></button>
            <button className="a-ico" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Down"><Ico n="down" size={15} /></button>
            <button className="a-btn sm ghost" onClick={() => toggle(s)}>{s.is_active ? 'Hide' : 'Show'}</button>
            <button className="a-btn sm" onClick={() => setF({ ...s, category_id: s.category_id || '' })}>Edit</button>
            <button className="a-ico" onClick={() => del(s)} aria-label="Delete"><Ico n="trash" size={15} /></button>
          </div>
        </div>
      )) : <Empty title="No banners" text="Without banners your home page shows a plain brand header." />}

      {f ? (
        <Modal title={f.id ? 'Edit banner' : 'New banner'} onClose={() => setF(null)}
          footer={<><button className="a-btn ghost" onClick={() => setF(null)}>Cancel</button><button className="a-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save banner'}</button></>}>
          <Field label="Banner image">
            <ImageInput value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} folder="banners" hint="Best size: 1600 × 600 (wide)" />
          </Field>
          <Field label="Title" hint="(for your reference)"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Open category when tapped" hint="(optional)">
            <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
              <option value="">— No link —</option>
              {cats.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Display order"><input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} /></Field>
          <Toggle checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label={f.is_active ? 'Visible' : 'Hidden'} />
        </Modal>
      ) : null}
    </>
  );
}
