'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRows, money, dt, STATUS, STATUS_CLS } from '@/lib/admin';
import { Loading, Err, Empty, Modal, Field, useUI } from '../ui';
import { methodLabel } from '@/app/PayGateway';

/* payment helpers (old orders have no payment info = Cash on Delivery) */
const pmOf = (o) => String(o.payment_method || 'cod').toLowerCase();
const psOf = (o) => o.payment_status || 'pending';
const PS_LABEL = { pending: 'Pending', verifying: 'Verifying', paid: 'Paid / Received', failed: 'Not received' };
const payBadge = (o) => {
  const m = pmOf(o), s = psOf(o);
  if (m === 'online') return s === 'paid' ? ['g', 'Online · Paid'] : s === 'failed' ? ['r', 'Online · Not received'] : ['o', 'Online · Verify'];
  if (m === 'cod_advance') return s === 'paid' ? ['g', 'COD · Advance paid'] : s === 'failed' ? ['r', 'COD · Advance not received'] : ['o', 'COD · Verify advance'];
  return s === 'paid' ? ['g', 'COD · Collected'] : ['b', 'COD'];
};
const dueOf = (o) => (o.due_amount ?? o.total);

function Detail({ o, onClose, onSaved, onDeleted }) {
  const { toast, confirm } = useUI();
  const [st, setSt] = useState(o.status);
  const [note, setNote] = useState(o.admin_note || '');
  const [pst, setPst] = useState(psOf(o));
  const [busy, setBusy] = useState(false);
  const hasPay = 'payment_status' in o; // false until 1-payments.sql is run
  const m = pmOf(o);
  const a = o.address || {};
  const phone = '91' + String(o.customer_phone || '').replace(/\D/g, '').slice(-10);

  const save = async () => {
    setBusy(true);
    const patch = { status: st, admin_note: note };
    if (hasPay && pst !== psOf(o)) {
      patch.payment_status = pst;
      patch.payment_verified_at = pst === 'paid' ? new Date().toISOString() : null;
    }
    const { error } = await supabase.from('orders').update(patch).eq('id', o.id);
    setBusy(false);
    if (error) return toast(error.message, 'err');
    toast('Order updated');
    onSaved({ ...o, ...patch });
  };
  const del = async () => {
    if (!(await confirm('Delete this order permanently?'))) return;
    const { error } = await supabase.from('orders').delete().eq('id', o.id);
    if (error) return toast(error.message, 'err');
    toast('Order deleted');
    onDeleted(o.id);
  };
  const msg = `Hello ${o.customer_name}, your order ${o.id} (${money(o.total)}) status: ${STATUS[st]}. Thank you!`;

  return (
    <Modal title={'Order ' + o.id} onClose={onClose} wide
      footer={<>
        <button className="a-btn danger sm" onClick={del}>Delete</button>
        <span style={{ flex: 1 }} />
        <button className="a-btn ghost" onClick={onClose}>Close</button>
        <button className="a-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </>}>
      <dl className="a-kv">
        <dt>Placed</dt><dd>{dt(o.created_at)}</dd>
        <dt>Customer</dt><dd>{a.name} · <a href={'tel:' + o.customer_phone}>{o.customer_phone}</a></dd>
        <dt>Address</dt><dd>{a.line}{a.lm ? ', ' + a.lm : ''}, {a.city}, {a.state} - {a.pin}</dd>
        <dt>Payment</dt><dd>{methodLabel(m)} <span className={'a-badge ' + payBadge(o)[0]}>{payBadge(o)[1]}</span></dd>
        {m !== 'cod' ? <><dt>Paid online</dt><dd>{money(o.paid_amount)}{o.payment_app ? ' via ' + o.payment_app : ''}</dd></> : null}
        {m !== 'cod' && o.payment_utr ? <><dt>UTR / Txn ID</dt><dd>{o.payment_utr}</dd></> : null}
        {m !== 'cod' && o.payment_upi ? <><dt>Paid to UPI</dt><dd>{o.payment_upi}</dd></> : null}
        <dt>Collect on delivery</dt><dd><b>{money(m === 'online' ? 0 : dueOf(o))}</b></dd>
      </dl>
      <div className="a-lines">
        {(o.items || []).map((i, n) => (
          <div key={n}>
            {i.img ? <img src={i.img} alt="" /> : <img alt="" />}
            <div className="a-grow"><b>{i.n}</b><small style={{ color: '#7a6a5e', display: 'block' }}>{i.k} × {i.q}</small></div>
            <b>{money(i.t)}</b>
          </div>
        ))}
      </div>
      <div className="a-sum"><span>Items (MRP)</span><span>{money(o.subtotal)}</span></div>
      {o.discount > 0 ? <div className="a-sum"><span>Discount</span><span>− {money(o.discount)}</span></div> : null}
      {o.coupon_discount > 0 ? <div className="a-sum"><span>Coupon {o.coupon_code}</span><span>− {money(o.coupon_discount)}</span></div> : null}
      <div className="a-sum"><span>Delivery</span><span>{o.shipping > 0 ? money(o.shipping) : 'FREE'}</span></div>
      <div className="a-sum t"><span>Order total</span><span>{money(o.total)}</span></div>

      <div style={{ marginTop: 16 }}>
        {hasPay ? (
          <Field label="Payment status" hint={m === 'cod' ? '(set to Paid after you collect the cash)' : '(check your UPI app, then set to Paid)'}>
            <select value={pst} onChange={(e) => setPst(e.target.value)}>
              {Object.entries(PS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        ) : null}
        <Field label="Order status">
          <select value={st} onChange={(e) => setSt(Number(e.target.value))}>
            {STATUS.map((s, i) => <option key={s} value={i}>{s}</option>)}
          </select>
        </Field>
        <Field label="Private note" hint="(only you can see this)">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Courier name, tracking no., remarks…" />
        </Field>
        <div className="a-row">
          <a className="a-btn green sm" href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener">WhatsApp customer</a>
          <a className="a-btn ghost sm" href={'tel:' + o.customer_phone}>Call</a>
          <button className="a-btn ghost sm" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(`${a.name}, ${o.customer_phone}\n${a.line}${a.lm ? ', ' + a.lm : ''}\n${a.city}, ${a.state} - ${a.pin}`); toast('Address copied'); }}>Copy address</button>
        </div>
      </div>
    </Modal>
  );
}

export default function Orders() {
  const { toast } = useUI();
  const { rows, err, setRows } = useRows(() => supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500));
  const [f, setF] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [days, setDays] = useState('all');
  if (!rows) return <Loading />;

  const list = rows.filter((o) =>
    (f === 'all' || o.status === Number(f)) &&
    (days === 'all' || Date.now() - new Date(o.created_at).getTime() <= Number(days) * 86400000) &&
    (o.id + ' ' + (o.customer_name || '') + ' ' + (o.customer_phone || '')).toLowerCase().includes(q.toLowerCase().trim()));

  const quick = async (o, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id);
    if (error) return toast(error.message, 'err');
    setRows((r) => r.map((x) => (x.id === o.id ? { ...x, status } : x)));
    toast('Status: ' + STATUS[status]);
  };

  const exportCsv = () => {
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const head = ['Order ID', 'Date', 'Status', 'Customer', 'Phone', 'Address', 'Items', 'Subtotal (MRP)', 'Discount', 'Coupon', 'Coupon discount', 'Delivery', 'Total', 'Payment method', 'Payment status', 'Paid online', 'Pay on delivery', 'Payment app', 'UTR', 'Note'];
    const body = list.map((o) => {
      const a = o.address || {};
      return [o.id, new Date(o.created_at).toLocaleString('en-IN'), STATUS[o.status], o.customer_name, o.customer_phone,
        [a.line, a.lm, a.city, a.state, a.pin].filter(Boolean).join(', '),
        (o.items || []).map((i) => `${i.n} (${i.k}) x${i.q}`).join('; '),
        o.subtotal, o.discount, o.coupon_code, o.coupon_discount, o.shipping, o.total,
        methodLabel(pmOf(o)), PS_LABEL[psOf(o)], o.paid_amount || 0, pmOf(o) === 'online' ? 0 : dueOf(o), o.payment_app, o.payment_utr, o.admin_note].map(esc).join(',');
    });
    const blob = new Blob(['\ufeff' + [head.map(esc).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'orders-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Exported ${list.length} order(s)`);
  };
  const shown = list.filter((o) => o.status !== 5).reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <Err msg={err} />
      <div className="a-tabs">
        {[['all', 'All (' + rows.length + ')'], ...STATUS.map((s, i) => [String(i), s + ' (' + rows.filter((x) => x.status === i).length + ')'])].map(([v, l]) => (
          <button key={v} className={f === v ? 'on' : ''} onClick={() => setF(v)}>{l}</button>
        ))}
      </div>
      <div className="a-bar">
        <input type="search" placeholder="Search order ID, name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Date range">
          <option value="all">All time</option><option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
        </select>
        <button className="a-btn ghost" onClick={exportCsv} disabled={!list.length}>Export CSV</button>
      </div>
      {list.length ? <p className="a-sub">{list.length} order(s) · {money(shown)} (cancelled orders not counted)</p> : null}
      {list.length ? list.map((o) => (
        <div className="a-item" key={o.id}>
          <div className="a-grow" style={{ cursor: 'pointer' }} onClick={() => setOpen(o)}>
            <h4>{o.id} <span className={'a-badge ' + STATUS_CLS[o.status]}>{STATUS[o.status]}</span> <span className={'a-badge ' + payBadge(o)[0]}>{payBadge(o)[1]}</span></h4>
            <small>{o.customer_name} · {o.customer_phone} · {dt(o.created_at)}</small>
            <small>{(o.items || []).map((i) => `${i.n} (${i.k}) ×${i.q}`).join(', ')}</small>
          </div>
          <b>{money(o.total)}</b>
          <div className="a-acts">
            <select value={o.status} onChange={(e) => quick(o, Number(e.target.value))} style={{ width: 'auto', padding: '6px 8px' }} aria-label="Change status">
              {STATUS.map((s, i) => <option key={s} value={i}>{s}</option>)}
            </select>
            <button className="a-btn sm ghost" onClick={() => setOpen(o)}>Open</button>
          </div>
        </div>
      )) : <Empty title="No orders" text="Orders placed on your website will appear here." />}
      {open ? <Detail o={open} onClose={() => setOpen(null)}
        onSaved={(n) => { setRows((r) => r.map((x) => (x.id === n.id ? n : x))); setOpen(null); }}
        onDeleted={(id) => { setRows((r) => r.filter((x) => x.id !== id)); setOpen(null); }} /> : null}
    </>
  );
}
