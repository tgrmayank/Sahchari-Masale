'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { uploadImage } from '@/lib/upload';

const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  bag: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M9 9.5a1 1 0 1 0 0-.01',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  truck: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 18a2 2 0 1 0 0-.01M17 18a2 2 0 1 0 0-.01',
  shop: 'M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 0 0 5.3 2 3 3 0 0 0 5.4 0A3 3 0 0 0 20 9M10 20v-5h4v5',
  text: 'M4 6h16M4 12h16M4 18h10',
  file: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8',
  out: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.500 0 18M12 3c-3 3.5-3 14.500 0 18',
  menu: 'M4 6h16M4 12h16M4 18h16',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M5 12l7 7 7-7',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  plus: 'M12 5v14M5 12h14',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
};
export function Ico({ n, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[n] || ''} />
    </svg>
  );
}

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dlg, setDlg] = useState(null);
  const toast = useCallback((msg, type = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'err' ? 6000 : 2600);
  }, []);
  const confirm = useCallback((msg, opts = {}) => new Promise((resolve) => setDlg({ msg, resolve, ...opts })), []);
  const close = (v) => { dlg.resolve(v); setDlg(null); };
  return (
    <UICtx.Provider value={{ toast, confirm }}>
      {children}
      <div className="a-toasts">
        {toasts.map((t) => <div key={t.id} className={'a-toast' + (t.type === 'err' ? ' err' : '')}>{t.msg}</div>)}
      </div>
      {dlg ? (
        <div className="a-ovl" style={{ zIndex: 150 }} onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="a-dlg">
            <p>{dlg.msg}</p>
            <div className="a-row end">
              <button className="a-btn ghost" onClick={() => close(false)}>Cancel</button>
              <button className={'a-btn' + (dlg.danger === false ? '' : ' danger')} onClick={() => close(true)}>{dlg.ok || 'Yes, delete'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </UICtx.Provider>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    const f = (e) => e.key === 'Escape' && ref.current();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
  return (
    <div className="a-ovl" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'a-modal' + (wide ? ' wide' : '')}>
        <div className="a-mh"><h3>{title}</h3><button className="a-x" onClick={onClose} aria-label="Close">×</button></div>
        <div className="a-mb">{children}</div>
        {footer ? <div className="a-mf">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="a-f">
      <span>{label}{hint ? <em>{hint}</em> : null}</span>
      {children}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <span className={'a-tg' + (checked ? ' on' : '')} role="switch" aria-checked={!!checked} tabIndex={0}
      onClick={() => onChange(!checked)} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onChange(!checked))}>
      <i />{label}
    </span>
  );
}

export const Loading = () => <div className="a-load" style={{ minHeight: 200 }}><span /></div>;
export const Empty = ({ title, text, children }) => (
  <div className="a-empty"><b>{title}</b>{text}{children ? <div style={{ marginTop: 12 }}>{children}</div> : null}</div>
);
export const Err = ({ msg }) => (msg ? <div className="a-err">{msg}</div> : null);


/** Paste an image link (https://...) instead of uploading a file */
function UrlAdd({ onAdd, disabled }) {
  const { toast } = useUI();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState('');
  const add = () => {
    const u = v.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) return toast('Enter a valid image link starting with https://', 'err');
    onAdd(u);
    setV('');
    setOpen(false);
  };
  if (!open) return <button type="button" className="a-btn sm ghost" onClick={() => setOpen(true)} disabled={disabled}>Use image link</button>;
  return (
    <div className="a-row" style={{ width: '100%', flexWrap: 'nowrap' }}>
      <input value={v} autoFocus placeholder="https://example.com/photo.jpg" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
      <button type="button" className="a-btn sm" onClick={add}>Add</button>
      <button type="button" className="a-btn sm ghost" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}

export function ImageInput({ value, onChange, folder, label = 'Upload image', hint, round }) {
  const { toast } = useUI();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadImage(f, folder)); } catch (er) { toast(er.message, 'err'); }
    setBusy(false);
  };
  return (
    <div className="a-img">
      <div className={'a-prev' + (round ? ' round' : '')}>
        {value ? <img src={value} alt="" /> : <span>No image</span>}
        {busy ? <i className="a-spin" /> : null}
      </div>
      <div className="a-row">
        <button type="button" className="a-btn sm" onClick={() => ref.current.click()} disabled={busy}>{value ? 'Replace image' : label}</button>
        <UrlAdd onAdd={onChange} disabled={busy} />
        {value ? <button type="button" className="a-btn sm ghost danger-t" onClick={() => onChange('')}>Remove</button> : null}
      </div>
      {hint ? <small className="a-hint">{hint}</small> : null}
      <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

export function MultiImages({ values, onChange, folder, max = 8 }) {
  const { toast } = useUI();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    let cur = values.slice();
    for (const f of files) {
      if (cur.length >= max) { toast(`Maximum ${max} images`, 'err'); break; }
      try { cur = [...cur, await uploadImage(f, folder)]; onChange(cur); } catch (er) { toast(er.message, 'err'); }
    }
    setBusy(false);
  };
  const move = (i, d) => { const a = values.slice(); const j = i + d; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div>
      <div className="a-thumbs">
        {values.map((u, i) => (
          <div className="a-thumb" key={u + i}>
            {i === 0 ? <span className="main">MAIN</span> : null}
            <img src={u} alt="" />
            <div className="tb">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left">‹</button>
              <button type="button" onClick={() => onChange(values.filter((_, k) => k !== i))} aria-label="Remove" style={{ color: '#c62828' }}>×</button>
              <button type="button" disabled={i === values.length - 1} onClick={() => move(i, 1)} aria-label="Move right">›</button>
            </div>
          </div>
        ))}
        {values.length < max ? (
          <button type="button" className="a-add" onClick={() => ref.current.click()} disabled={busy}>
            {busy ? <i className="a-spin" /> : <span>+ Add<br />photos</span>}
          </button>
        ) : null}
      </div>
      {values.length < max ? <div className="a-row" style={{ marginTop: 8 }}><UrlAdd onAdd={(u) => onChange([...values, u])} disabled={busy} /></div> : null}
      <small className="a-hint">The first photo is the main photo. Upload from your phone or computer, or paste an image link. Up to {max} photos.</small>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={pick} />
    </div>
  );
}

/** Editable list of one-line texts */
export function ListEditor({ items, onChange, placeholder, max = 12 }) {
  const set = (i, v) => onChange(items.map((x, k) => (k === i ? v : x)));
  return (
    <div>
      {items.map((x, i) => (
        <div className="a-row" key={i} style={{ marginBottom: 8, flexWrap: 'nowrap' }}>
          <input value={x} placeholder={placeholder} onChange={(e) => set(i, e.target.value)} />
          <button type="button" className="a-ico" disabled={i === 0} onClick={() => { const a = items.slice(); [a[i - 1], a[i]] = [a[i], a[i - 1]]; onChange(a); }} aria-label="Up"><Ico n="up" size={15} /></button>
          <button type="button" className="a-ico" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Delete"><Ico n="trash" size={15} /></button>
        </div>
      ))}
      {items.length < max ? <button type="button" className="a-btn sm ghost" onClick={() => onChange([...items, ''])}><Ico n="plus" size={14} />Add line</button> : null}
    </div>
  );
}
