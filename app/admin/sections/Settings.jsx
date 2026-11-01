'use client';
import { useEffect, useState } from 'react';
import { useSettings, money } from '@/lib/admin';
import { Loading, Err, Field, ImageInput, ListEditor, Ico, useUI } from '../ui';

/** Shared wrapper: loads settings, keeps a draft, saves with one button. */
function useDraft(pick) {
  const { toast } = useUI();
  const { s, err, save } = useSettings();
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (s && !d) setD(pick(s)); }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const submit = async (build) => {
    setBusy(true);
    try { await save(build ? build(d) : d); toast('Saved. Website updated.'); }
    catch (e) { toast(e.message, 'err'); }
    setBusy(false);
  };
  return { d, set, err, busy, submit };
}

const SaveBar = ({ busy, onClick }) => (
  <div className="a-row end" style={{ position: 'sticky', bottom: 10 }}>
    <button className="a-btn" onClick={onClick} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
  </div>
);

/* ---------------- Delivery charges ---------------- */
export function Delivery() {
  const { d, set, err, busy, submit } = useDraft((s) => ({ free_ship_min: s.free_ship_min ?? 0, ship_fee: s.ship_fee ?? 0, delivery_days: s.delivery_days || '' }));
  if (!d) return <Loading />;
  const num = (v) => Math.max(0, Number(v) || 0);
  return (
    <>
      <Err msg={err} />
      <div className="a-card">
        <h3>Delivery charges</h3>
        <p className="a-sub">Applied automatically at checkout. The server re-checks this on every order.</p>
        <div className="a-grid c2">
          <Field label="Delivery charge ₹" hint="(when order is small)"><input type="number" min="0" value={d.ship_fee} onChange={(e) => set({ ship_fee: e.target.value })} /></Field>
          <Field label="Free delivery above ₹" hint="(0 = always free)"><input type="number" min="0" value={d.free_ship_min} onChange={(e) => set({ free_ship_min: e.target.value })} /></Field>
        </div>
        <Field label="Delivery time text"><input value={d.delivery_days} onChange={(e) => set({ delivery_days: e.target.value })} placeholder="3-5 days" /></Field>
        <div className="a-ok">Customers pay {money(num(d.ship_fee))} delivery on orders below {money(num(d.free_ship_min))}; delivery is free on orders of {money(num(d.free_ship_min))} or more.</div>
        <p className="a-hint" style={{ marginBottom: 12 }}>Remember to also update the “Free delivery” lines in <b>Homepage Text</b> and <b>Terms</b>.</p>
      </div>
      <SaveBar busy={busy} onClick={() => submit((x) => ({ ship_fee: num(x.ship_fee), free_ship_min: num(x.free_ship_min), delivery_days: x.delivery_days.trim() }))} />
    </>
  );
}

/* ---------------- Store & contact ---------------- */
export function StoreInfo() {
  const { d, set, err, busy, submit } = useDraft((s) => ({
    brand_name: s.brand_name || '', tagline: s.tagline || '', logo_url: s.logo_url || '', phone_display: s.phone_display || '',
    whatsapp: s.whatsapp || '', email: s.email || '', instagram_url: s.instagram_url || '', instagram_handle: s.instagram_handle || '',
    instagram_followers: s.instagram_followers || '', map_url: s.map_url || '', address: s.address || '',
  }));
  if (!d) return <Loading />;
  const t = (k, label, extra = {}, hint) => (
    <Field label={label} hint={hint}><input value={d[k]} onChange={(e) => set({ [k]: e.target.value })} {...extra} /></Field>
  );
  return (
    <>
      <Err msg={err} />
      <div className="a-card">
        <h3>Brand</h3>
        <div className="a-grid c2">
          <Field label="Logo"><ImageInput round value={d.logo_url} onChange={(v) => set({ logo_url: v })} folder="brand" hint="Square image. Empty = default logo" /></Field>
          <div>
            {t('brand_name', 'Store name')}
            {t('tagline', 'Tagline')}
          </div>
        </div>
      </div>
      <div className="a-card">
        <h3>Contact</h3>
        <div className="a-grid c2">
          {t('phone_display', 'Phone (as shown)', { placeholder: '83687 52030' })}
          {t('whatsapp', 'WhatsApp / call number', { placeholder: '918368752030', inputMode: 'numeric' }, '(with 91, digits only)')}
        </div>
        {t('email', 'Email', { type: 'email' })}
        {t('address', 'Address / location text')}
        {t('map_url', 'Google Maps link', { placeholder: 'https://maps.google.com/…' })}
      </div>
      <div className="a-card">
        <h3>Instagram</h3>
        {t('instagram_url', 'Profile link', { placeholder: 'https://instagram.com/yourpage' })}
        <div className="a-grid c2">
          {t('instagram_handle', 'Handle', { placeholder: '@yourpage' })}
          {t('instagram_followers', 'Followers text', { placeholder: '91 Followers' })}
        </div>
      </div>
      <SaveBar busy={busy} onClick={() => submit((x) => ({
        brand_name: x.brand_name.trim() || 'My Store', tagline: x.tagline.trim(), logo_url: x.logo_url,
        phone_display: x.phone_display.trim(), whatsapp: x.whatsapp.replace(/\D/g, ''), email: x.email.trim(),
        instagram_url: x.instagram_url.trim(), instagram_handle: x.instagram_handle.trim(), instagram_followers: x.instagram_followers.trim(),
        map_url: x.map_url.trim(), address: x.address.trim(),
      }))} />
    </>
  );
}

/* ---------------- Homepage text ---------------- */
export function HomeContent() {
  const { d, set, err, busy, submit } = useDraft((s) => ({
    announcements: s.announcements || [], strip_items: s.strip_items || [],
    why_items: Array.isArray(s.why_items) ? s.why_items.map((w) => ({ t: w.t || '', s: w.s || '' })) : [],
  }));
  if (!d) return <Loading />;
  const setWhy = (i, p) => set({ why_items: d.why_items.map((w, n) => (n === i ? { ...w, ...p } : w)) });
  return (
    <>
      <Err msg={err} />
      <div className="a-card">
        <h3>Scrolling top bar</h3>
        <p className="a-sub">Messages that slide across the top of every page. Empty = bar hidden.</p>
        <ListEditor items={d.announcements} onChange={(v) => set({ announcements: v })} placeholder="e.g. Free delivery on orders above ₹499" />
      </div>
      <div className="a-card">
        <h3>Highlights under search</h3>
        <p className="a-sub">Short points shown with small icons (truck, cash, leaf, shield…).</p>
        <ListEditor items={d.strip_items} onChange={(v) => set({ strip_items: v })} placeholder="e.g. Cash on Delivery" max={8} />
      </div>
      <div className="a-card">
        <h3>“Why choose us” section</h3>
        {d.why_items.map((w, i) => (
          <div className="a-row" key={i} style={{ marginBottom: 8, flexWrap: 'nowrap' }}>
            <input value={w.t} placeholder="Title" onChange={(e) => setWhy(i, { t: e.target.value })} />
            <input value={w.s} placeholder="Small text" onChange={(e) => setWhy(i, { s: e.target.value })} />
            <button type="button" className="a-ico" onClick={() => set({ why_items: d.why_items.filter((_, n) => n !== i) })} aria-label="Delete"><Ico n="trash" size={15} /></button>
          </div>
        ))}
        {d.why_items.length < 8 ? <button type="button" className="a-btn sm ghost" onClick={() => set({ why_items: [...d.why_items, { t: '', s: '' }] })}><Ico n="plus" size={14} />Add point</button> : null}
      </div>
      <SaveBar busy={busy} onClick={() => submit((x) => ({
        announcements: x.announcements.map((a) => a.trim()).filter(Boolean),
        strip_items: x.strip_items.map((a) => a.trim()).filter(Boolean),
        why_items: x.why_items.filter((w) => w.t.trim()).map((w) => ({ t: w.t.trim(), s: w.s.trim() })),
      }))} />
    </>
  );
}

/* ---------------- Terms & privacy ---------------- */
function PolicyEditor({ title, v, onChange }) {
  const p = v || { intro: '', chips: [], sections: [] };
  const setSec = (i, patch) => onChange({ ...p, sections: p.sections.map((s, n) => (n === i ? { ...s, ...patch } : s)) });
  return (
    <div className="a-card">
      <h3>{title}</h3>
      <Field label="Intro text"><textarea value={p.intro || ''} onChange={(e) => onChange({ ...p, intro: e.target.value })} /></Field>
      <Field label="Highlight chips" hint="(short points)"><ListEditor items={p.chips || []} onChange={(c) => onChange({ ...p, chips: c })} max={4} placeholder="e.g. Cash on Delivery only" /></Field>
      <h4 style={{ margin: '14px 0 8px' }}>Sections</h4>
      {(p.sections || []).map((s, i) => (
        <div key={i} className="a-card" style={{ background: '#fffdf8', boxShadow: 'none' }}>
          <div className="a-row" style={{ flexWrap: 'nowrap', marginBottom: 8 }}>
            <input value={s.title || ''} placeholder="Section title" onChange={(e) => setSec(i, { title: e.target.value })} />
            <button type="button" className="a-ico" disabled={i === 0} onClick={() => { const a = p.sections.slice(); [a[i - 1], a[i]] = [a[i], a[i - 1]]; onChange({ ...p, sections: a }); }} aria-label="Up"><Ico n="up" size={15} /></button>
            <button type="button" className="a-ico" onClick={() => onChange({ ...p, sections: p.sections.filter((_, n) => n !== i) })} aria-label="Delete"><Ico n="trash" size={15} /></button>
          </div>
          <textarea value={(s.items || []).join('\n')} placeholder="One point per line" onChange={(e) => setSec(i, { items: e.target.value.split('\n') })} />
        </div>
      ))}
      <button type="button" className="a-btn sm ghost" onClick={() => onChange({ ...p, sections: [...(p.sections || []), { title: '', items: [''] }] })}><Ico n="plus" size={14} />Add section</button>
    </div>
  );
}

export function Policies() {
  const { d, set, err, busy, submit } = useDraft((s) => ({ terms: s.terms || { intro: '', chips: [], sections: [] }, privacy: s.privacy || { intro: '', chips: [], sections: [] } }));
  if (!d) return <Loading />;
  const clean = (p) => ({
    intro: (p.intro || '').trim(),
    chips: (p.chips || []).map((c) => c.trim()).filter(Boolean),
    sections: (p.sections || []).filter((s) => (s.title || '').trim()).map((s) => ({ title: s.title.trim(), items: (s.items || []).map((i) => i.trim()).filter(Boolean) })),
  });
  return (
    <>
      <Err msg={err} />
      <PolicyEditor title="Terms & Conditions" v={d.terms} onChange={(v) => set({ terms: v })} />
      <PolicyEditor title="Privacy Policy" v={d.privacy} onChange={(v) => set({ privacy: v })} />
      <SaveBar busy={busy} onClick={() => submit((x) => ({ terms: clean(x.terms), privacy: clean(x.privacy) }))} />
    </>
  );
}
