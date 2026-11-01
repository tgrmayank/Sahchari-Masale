'use client';
import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRows, money } from '@/lib/admin';
import { Loading, Err, Empty, Modal, Field, Toggle, MultiImages, Ico, useUI } from '../ui';

const TAGS = ['Bestseller', 'Hot Pick', 'New', 'Pure', 'Premium', 'Offer'];
const blank = () => ({
  name: '', category_id: '', caption: '', description: '', ingredients: '', tag: '', tag_color: '#d9a21b',
  images: [], packs: [{ label: '', price: '', mrp: '' }], in_stock: true, is_active: true, sort_order: 0,
});

export default function Products() {
  const { toast, confirm } = useUI();
  const { rows, err, reload } = useRows(() => supabase.from('products').select('*').order('sort_order').order('id', { ascending: false }));
  const cats = useRows(() => supabase.from('categories').select('id,name').order('sort_order'));
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [cf, setCf] = useState('');
  const fileRef = useRef(null);
  const [sort, setSort] = useState('new');
  const [sf, setSf] = useState('');
  if (!rows || !cats.rows) return <Loading />;

  const cname = (id) => (cats.rows.find((c) => c.id === id) || {}).name || 'No category';
  const low = (p) => Math.min(...(p.packs || []).map((k) => Number(k.price)), Infinity);
  const list = rows
    .filter((p) => (!cf || String(p.category_id || 'none') === cf) && p.name.toLowerCase().includes(q.toLowerCase().trim()))
    .filter((p) => !sf || (sf === 'hidden' ? !p.is_active : sf === 'sold' ? !p.in_stock : sf === 'nophoto' ? !(p.images || []).length : true))
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'low' ? low(a) - low(b) : sort === 'high' ? low(b) - low(a) : 0));

  const edit = (p) => setF({
    ...p, category_id: p.category_id || '', images: p.images || [],
    packs: (p.packs || []).length ? p.packs.map((k) => ({ label: k.label, price: k.price, mrp: k.mrp || '' })) : [{ label: '', price: '', mrp: '' }],
  });
  const setPack = (i, patch) => setF({ ...f, packs: f.packs.map((k, n) => (n === i ? { ...k, ...patch } : k)) });

  const save = async () => {
    const name = f.name.trim();
    if (!name) return toast('Product name is required', 'err');
    const packs = f.packs
      .filter((k) => String(k.label).trim() && Number(k.price) > 0)
      .map((k) => ({ label: String(k.label).trim(), price: Number(k.price), mrp: Number(k.mrp) > Number(k.price) ? Number(k.mrp) : Number(k.price) }));
    if (!packs.length) return toast('Add at least one pack with a name and price', 'err');
    setBusy(true);
    const row = {
      name, category_id: f.category_id ? Number(f.category_id) : null,
      caption: f.caption.trim(), description: f.description.trim(), ingredients: f.ingredients.trim(),
      tag: f.tag.trim(), tag_color: f.tag_color || '#d9a21b', images: f.images, packs,
      in_stock: !!f.in_stock, is_active: !!f.is_active, sort_order: Number(f.sort_order) || 0,
    };
    const { error } = await (f.id ? supabase.from('products').update(row).eq('id', f.id) : supabase.from('products').insert(row));
    setBusy(false);
    if (error) return toast(error.message, 'err');
    toast('Product saved');
    setF(null);
    reload();
  };
  const patch = async (p, v) => {
    const { error } = await supabase.from('products').update(v).eq('id', p.id);
    if (error) return toast(error.message, 'err');
    reload();
  };
  const del = async (p) => {
    if (!(await confirm(`Delete "${p.name}" permanently? Its reviews will be deleted too.`))) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) return toast(error.message, 'err');
    toast('Product deleted');
    reload();
  };
  const dup = async (p) => {
    const { id, created_at, ...rest } = p;
    const { error } = await supabase.from('products').insert({ ...rest, name: p.name + ' (Copy)', is_active: false });
    if (error) return toast(error.message, 'err');
    toast('Copied (hidden). Edit and show it.');
    reload();
  };


  const exportJson = () => {
    const out = list.map((p) => ({
      name: p.name, category: cname(p.category_id) === 'No category' ? '' : cname(p.category_id),
      caption: p.caption, description: p.description, ingredients: p.ingredients,
      tag: p.tag, tag_color: p.tag_color, images: p.images || [], packs: p.packs || [],
      in_stock: p.in_stock, is_active: p.is_active, sort_order: p.sort_order,
    }));
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Exported ${out.length} product(s)`);
  };
  const importJson = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data) || !data.length) throw new Error('The file must contain a list of products');
      const byName = new Map(cats.rows.map((c) => [c.name.toLowerCase(), c.id]));
      const rowsToAdd = data.map((x, n) => {
        const packs = (Array.isArray(x.packs) ? x.packs : []).filter((k) => k && String(k.label || '').trim() && Number(k.price) > 0)
          .map((k) => ({ label: String(k.label).trim(), price: Number(k.price), mrp: Number(k.mrp) > Number(k.price) ? Number(k.mrp) : Number(k.price) }));
        if (!String(x.name || '').trim()) throw new Error(`Product ${n + 1}: name is missing`);
        if (!packs.length) throw new Error(`"${x.name}": add at least one pack with a label and price`);
        return {
          name: String(x.name).trim(), category_id: byName.get(String(x.category || '').toLowerCase()) || null,
          caption: x.caption || '', description: x.description || '', ingredients: x.ingredients || '',
          tag: x.tag || '', tag_color: x.tag_color || '#d9a21b',
          images: (Array.isArray(x.images) ? x.images : []).filter((u) => /^https?:\/\//i.test(u)).slice(0, 8), packs,
          in_stock: x.in_stock !== false, is_active: x.is_active !== false, sort_order: Number(x.sort_order) || 0,
        };
      });
      if (!(await confirm(`Import ${rowsToAdd.length} product(s)? They will be added as new products.`))) return;
      const { error } = await supabase.from('products').insert(rowsToAdd);
      if (error) throw new Error(error.message);
      toast(`Imported ${rowsToAdd.length} product(s)`);
      reload();
    } catch (er) { toast(er.message || 'Could not read this JSON file', 'err'); }
  };

  return (
    <>
      <Err msg={err || cats.err} />
      <div className="a-bar">
        <input type="search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cf} onChange={(e) => setCf(e.target.value)}>
          <option value="">All categories</option>
          {cats.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="none">No category</option>
        </select>
        <select value={sf} onChange={(e) => setSf(e.target.value)} aria-label="Filter">
          <option value="">All products</option><option value="hidden">Hidden only</option><option value="sold">Sold out only</option><option value="nophoto">Without photo</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="new">Newest first</option><option value="name">Name A–Z</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
        </select>
        <button className="a-btn ghost" onClick={exportJson}>Export JSON</button>
        <button className="a-btn ghost" onClick={() => fileRef.current.click()}>Import JSON</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
        <button className="a-btn" onClick={() => setF(blank())}><Ico n="plus" size={16} />Add product</button>
      </div>

      {list.length ? list.map((p) => (
        <div className="a-item" key={p.id}>
          <div className="th">{(p.images || [])[0] ? <img src={p.images[0]} alt="" /> : 'no photo'}</div>
          <div className="a-grow">
            <h4>{p.name}</h4>
            <small>{cname(p.category_id)} · {(p.packs || []).map((k) => `${k.label} ${money(k.price)}`).join(' · ') || 'No pack/price'}</small>
            <div className="a-row" style={{ gap: 5, marginTop: 4 }}>
              <span className={'a-badge ' + (p.is_active ? 'g' : 'r')}>{p.is_active ? 'Visible' : 'Hidden'}</span>
              {!p.in_stock ? <span className="a-badge o">Out of stock</span> : null}
              {p.tag ? <span className="a-badge b">{p.tag}</span> : null}
              {!(p.packs || []).length ? <span className="a-badge r">Not shown: no pack</span> : null}
            </div>
          </div>
          <div className="a-acts">
            <button className="a-btn sm ghost" onClick={() => patch(p, { in_stock: !p.in_stock })}>{p.in_stock ? 'Mark sold out' : 'Back in stock'}</button>
            <button className="a-btn sm ghost" onClick={() => patch(p, { is_active: !p.is_active })}>{p.is_active ? 'Hide' : 'Show'}</button>
            <button className="a-btn sm" onClick={() => edit(p)}>Edit</button>
            <button className="a-ico" onClick={() => dup(p)} aria-label="Duplicate"><Ico n="copy" size={15} /></button>
            <button className="a-ico" onClick={() => del(p)} aria-label="Delete"><Ico n="trash" size={15} /></button>
          </div>
        </div>
      )) : <Empty title={rows.length ? 'No match' : 'No products yet'} text={rows.length ? 'Try another search.' : 'Add your first product with photos, packs and prices.'} />}

      {f ? (
        <Modal wide title={f.id ? 'Edit product' : 'New product'} onClose={() => setF(null)}
          footer={<><button className="a-btn ghost" onClick={() => setF(null)}>Cancel</button><button className="a-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button></>}>
          <Field label="Product name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Turmeric Powder" /></Field>
          <div className="a-grid c2">
            <Field label="Category">
              <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
                <option value="">— Select —</option>
                {cats.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Short line" hint="(under the name)"><input value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} placeholder="Golden colour, pure aroma" /></Field>
          </div>

          <Field label="Product photos"><MultiImages values={f.images} onChange={(v) => setF({ ...f, images: v })} folder="products" /></Field>

          <div className="a-card" style={{ background: '#fffdf8', boxShadow: 'none' }}>
            <h3>Packs & prices</h3>
            <p className="a-sub">Add as many packs as you like (e.g. 100 g, 500 g, 1 kg). Each pack has its own selling price and an optional MRP (the crossed-out price). Remove any pack with the bin icon.</p>
            <div className="a-pack-h"><span>Pack name</span><span>Price ₹</span><span>MRP ₹ (optional)</span><span /></div>
            {f.packs.map((k, i) => (
              <div className="a-pack" key={i}>
                <input value={k.label} placeholder="100 g" onChange={(e) => setPack(i, { label: e.target.value })} />
                <input type="number" min="0" inputMode="decimal" value={k.price} placeholder="Price" onChange={(e) => setPack(i, { price: e.target.value })} />
                <input type="number" min="0" inputMode="decimal" value={k.mrp} placeholder="MRP" onChange={(e) => setPack(i, { mrp: e.target.value })} />
                <button type="button" className="a-ico" disabled={f.packs.length === 1} onClick={() => setF({ ...f, packs: f.packs.filter((_, n) => n !== i) })} aria-label="Remove pack"><Ico n="trash" size={15} /></button>
              </div>
            ))}
            <div className="a-row">
              <button type="button" className="a-btn sm ghost" onClick={() => setF({ ...f, packs: [...f.packs, { label: '', price: '', mrp: '' }] })}><Ico n="plus" size={14} />Add pack</button>
              {['100 g', '250 g', '500 g', '1 kg'].map((l) => (
                <button type="button" key={l} className="a-btn sm ghost" onClick={() => setF({ ...f, packs: [...f.packs.filter((k) => k.label || k.price), { label: l, price: '', mrp: '' }] })}>+ {l}</button>
              ))}
            </div>
          </div>

          <Field label="Description"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Ingredients" hint="(separate with commas)"><input value={f.ingredients} onChange={(e) => setF({ ...f, ingredients: e.target.value })} placeholder="Turmeric 100%" /></Field>

          <div className="a-grid c2">
            <Field label="Label on photo" hint="(optional)">
              <input list="tags" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} placeholder="Bestseller" />
              <datalist id="tags">{TAGS.map((t) => <option key={t} value={t} />)}</datalist>
            </Field>
            <Field label="Label colour"><input type="color" value={f.tag_color || '#d9a21b'} onChange={(e) => setF({ ...f, tag_color: e.target.value })} /></Field>
          </div>
          <Field label="Display order" hint="(small number first)"><input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} /></Field>
          <div className="a-row" style={{ gap: 22 }}>
            <Toggle checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label={f.is_active ? 'Visible on website' : 'Hidden'} />
            <Toggle checked={f.in_stock} onChange={(v) => setF({ ...f, in_stock: v })} label={f.in_stock ? 'In stock' : 'Out of stock'} />
          </div>
        </Modal>
      ) : null}
    </>
  );
}
