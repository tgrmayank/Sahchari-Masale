'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRows, reorder } from '@/lib/admin';
import { Loading, Err, Empty, Modal, Field, Toggle, ImageInput, Ico, useUI } from '../ui';

const blank = { name: '', image_url: '', banner_url: '', sort_order: 0, is_active: true };

export default function Categories() {
  const { toast, confirm } = useUI();
  const { rows, err, reload } = useRows(() => supabase.from('categories').select('*').order('sort_order').order('id'));
  const pc = useRows(() => supabase.from('products').select('category_id'));
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!rows || !pc.rows) return <Loading />;

  const count = (id) => pc.rows.filter((p) => p.category_id === id).length;

  const save = async () => {
    const name = f.name.trim();
    if (!name) return toast('Category name is required', 'err');
    setBusy(true);
    const row = { name, image_url: f.image_url || '', banner_url: f.banner_url || '', sort_order: Number(f.sort_order) || 0, is_active: !!f.is_active };
    const q = f.id ? supabase.from('categories').update(row).eq('id', f.id) : supabase.from('categories').insert({ ...row, sort_order: row.sort_order || (rows.length + 1) * 10 });
    const { error } = await q;
    setBusy(false);
    if (error) return toast(/duplicate|unique/i.test(error.message) ? 'A category with this name already exists' : error.message, 'err');
    toast('Category saved');
    setF(null);
    reload();
  };
  const toggle = async (c) => {
    const { error } = await supabase.from('categories').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) return toast(error.message, 'err');
    reload();
  };
  const del = async (c) => {
    const n = count(c.id);
    if (!(await confirm(`Delete "${c.name}"?${n ? ` Its ${n} product(s) will stay but have no category.` : ''}`))) return;
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) return toast(error.message, 'err');
    toast('Category deleted');
    reload(); pc.reload();
  };
  const move = async (i, d) => {
    const m = await reorder('categories', rows, i, d);
    if (m) toast(m, 'err');
    reload();
  };

  return (
    <>
      <Err msg={err || pc.err} />
      <div className="a-row sb" style={{ marginBottom: 14 }}>
        <p className="a-sub" style={{ margin: 0 }}>Order here = order on the website. Use the arrows to move.</p>
        <button className="a-btn" onClick={() => setF({ ...blank })}><Ico n="plus" size={16} />Add category</button>
      </div>
      {rows.length ? rows.map((c, i) => (
        <div className="a-item" key={c.id}>
          <div className="th">{c.image_url ? <img src={c.image_url} alt="" /> : 'icon'}</div>
          <div className="th wide">{c.banner_url ? <img src={c.banner_url} alt="" /> : 'banner'}</div>
          <div className="a-grow">
            <h4>{c.name}</h4>
            <small>{count(c.id)} products · order {c.sort_order}</small>
            <span className={'a-badge ' + (c.is_active ? 'g' : 'r')}>{c.is_active ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="a-acts">
            <button className="a-ico" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Ico n="up" size={15} /></button>
            <button className="a-ico" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Ico n="down" size={15} /></button>
            <button className="a-btn sm ghost" onClick={() => toggle(c)}>{c.is_active ? 'Hide' : 'Show'}</button>
            <button className="a-btn sm" onClick={() => setF({ ...c })}>Edit</button>
            <button className="a-ico" onClick={() => del(c)} aria-label="Delete"><Ico n="trash" size={15} /></button>
          </div>
        </div>
      )) : <Empty title="No categories yet" text="Add categories like “Ground Spices”, then add products inside them." />}

      {f ? (
        <Modal title={f.id ? 'Edit category' : 'New category'} onClose={() => setF(null)}
          footer={<><button className="a-btn ghost" onClick={() => setF(null)}>Cancel</button><button className="a-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save category'}</button></>}>
          <Field label="Category name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Ground Spices" /></Field>
          <div className="a-grid c2">
            <Field label="Icon image" hint="(round, shown in list)">
              <ImageInput round value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} folder="categories" />
            </Field>
            <Field label="Banner image" hint="(wide, shown on top)">
              <ImageInput value={f.banner_url} onChange={(v) => setF({ ...f, banner_url: v })} folder="banners" hint="Best size: 1200 × 400" />
            </Field>
          </div>
          <Field label="Display order" hint="(small number comes first)"><input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} /></Field>
          <Toggle checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label={f.is_active ? 'Visible on website' : 'Hidden'} />
        </Modal>
      ) : null}
    </>
  );
}
