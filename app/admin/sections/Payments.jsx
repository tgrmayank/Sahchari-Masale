'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { money } from '@/lib/admin';
import { PAY_APPS, UPI_RE, advanceFor } from '@/app/PayGateway';
import { Loading, Err, Field, Toggle, useUI } from '../ui';

/* Admin -> Payments: choose how customers can pay and set your UPI ID. */
export default function Payments() {
  const { toast } = useUI();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('payment_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) {
        setErr(/payment_settings|schema cache|does not exist/i.test(error.message)
          ? 'Payment tables are not created yet. Run the file 1-payments.sql once in Supabase -> SQL Editor, then refresh this page.'
          : error.message);
        return;
      }
      const r = data || {};
      setD({
        cod_enabled: r.cod_enabled !== false,
        online_enabled: !!r.online_enabled,
        upi_id: r.upi_id || '',
        payee_name: r.payee_name || '',
        cod_advance_enabled: !!r.cod_advance_enabled,
        cod_advance_type: r.cod_advance_type === 'fixed' ? 'fixed' : 'percent',
        cod_advance_value: r.cod_advance_value ?? 0,
        hidden_apps: Array.isArray(r.hidden_apps) ? r.hidden_apps : [],
        qr_seconds: r.qr_seconds || 120,
      });
    });
  }, []);

  if (err && !d) return <Err msg={err} />;
  if (!d) return <Loading />;

  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const upi = d.upi_id.trim();
  const upiOk = UPI_RE.test(upi);
  const shown = PAY_APPS.filter((a) => !d.hidden_apps.includes(a.n));
  const onlineReady = d.online_enabled && upiOk && shown.length > 0;
  const advVal = Number(d.cod_advance_value) || 0;
  const example = advanceFor({ advOn: true, advType: d.cod_advance_type, advVal }, 1000);

  const toggleApp = (n) =>
    set({ hidden_apps: d.hidden_apps.includes(n) ? d.hidden_apps.filter((x) => x !== n) : [...d.hidden_apps, n] });

  const save = async () => {
    if (!d.cod_enabled && !d.online_enabled) return toast('Turn on at least one payment method, otherwise customers cannot order.', 'err');
    if (d.online_enabled && !upiOk) return toast('Enter a valid UPI ID, for example name@bank', 'err');
    if (d.online_enabled && !shown.length) return toast('Select at least one UPI app to show.', 'err');
    if (d.cod_advance_enabled) {
      if (advVal <= 0) return toast('Enter the advance amount or percentage', 'err');
      if (d.cod_advance_type === 'percent' && advVal > 100) return toast('Percentage cannot be more than 100', 'err');
    }
    setBusy(true);
    const row = {
      id: 1,
      cod_enabled: d.cod_enabled,
      online_enabled: d.online_enabled,
      upi_id: upi,
      payee_name: d.payee_name.trim(),
      cod_advance_enabled: d.cod_advance_enabled,
      cod_advance_type: d.cod_advance_type,
      cod_advance_value: advVal,
      hidden_apps: d.hidden_apps,
      qr_seconds: Math.min(600, Math.max(60, Math.round(Number(d.qr_seconds) || 120))),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('payment_settings').upsert(row);
    setBusy(false);
    if (error) return toast(error.message, 'err');
    toast('Saved. Website updated.');
  };

  const summary = d.cod_enabled && d.online_enabled
    ? 'Customers will see two options: Cash on Delivery and Online Payment (UPI).'
    : d.online_enabled ? 'Customers can pay only online (UPI). Cash on Delivery is hidden.'
    : d.cod_enabled ? 'Customers can pay only by Cash on Delivery.'
    : 'No payment method is on. Customers cannot place orders.';

  return (
    <>
      <Err msg={err} />
      <div className={d.cod_enabled || d.online_enabled ? 'a-ok' : 'a-warn'} style={{ marginBottom: 14 }}>{summary}</div>

      <div className="a-card">
        <h3>Payment methods</h3>
        <p className="a-sub">Wherever the website says “Cash on Delivery” (footer, product page, orders, success page) it now follows these switches.</p>
        <div className="a-row sb" style={{ padding: '8px 0' }}>
          <div><b>Cash on Delivery</b><small className="a-hint">Customer pays cash when the parcel arrives.</small></div>
          <Toggle checked={d.cod_enabled} onChange={(v) => set({ cod_enabled: v })} label={d.cod_enabled ? 'On' : 'Off'} />
        </div>
        <div className="a-row sb" style={{ padding: '8px 0', borderTop: '1px solid var(--ln)' }}>
          <div><b>Online payment (UPI)</b><small className="a-hint">Secure checkout with QR code and UPI apps.</small></div>
          <Toggle checked={d.online_enabled} onChange={(v) => set({ online_enabled: v })} label={d.online_enabled ? 'On' : 'Off'} />
        </div>
        {d.online_enabled ? (
          <div style={{ marginTop: 10 }}>
            <div className="a-grid c2">
              <Field label="Your UPI ID" hint="(money comes here)">
                <input value={d.upi_id} onChange={(e) => set({ upi_id: e.target.value.trim() })} placeholder="yourname@bank" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
              </Field>
              <Field label="Payee name" hint="(shown to customers)">
                <input value={d.payee_name} onChange={(e) => set({ payee_name: e.target.value })} placeholder="Sahchari Masale" />
              </Field>
            </div>
            {upi && !upiOk ? <div className="a-warn">This UPI ID does not look right. It should look like <b>name@bank</b>.</div> : null}
            <p className="a-hint" style={{ marginTop: 8 }}>
              The checkout shows your store name, logo and contact details (from <b>Store &amp; Contact</b>). Payments go straight to this UPI ID.
              Check your UPI app and mark each order as <b>Paid</b> in <b>Orders</b>.
            </p>
          </div>
        ) : null}
      </div>

      <div className="a-card">
        <h3>Advance payment on Cash on Delivery</h3>
        <p className="a-sub">Ask customers to pay a part online. The rest is paid in cash on delivery. Needs Online payment to be on.</p>
        <div className="a-row sb" style={{ padding: '4px 0 8px' }}>
          <b>Require advance for COD orders</b>
          <Toggle checked={d.cod_advance_enabled} onChange={(v) => set({ cod_advance_enabled: v })} label={d.cod_advance_enabled ? 'On' : 'Off'} />
        </div>
        {d.cod_advance_enabled ? (
          <>
            <div className="a-grid c2">
              <Field label="Advance type">
                <select value={d.cod_advance_type} onChange={(e) => set({ cod_advance_type: e.target.value })}>
                  <option value="percent">Percentage of order total (%)</option>
                  <option value="fixed">Fixed amount (₹)</option>
                </select>
              </Field>
              <Field label={d.cod_advance_type === 'percent' ? 'Advance %' : 'Advance ₹'}>
                <input type="number" min="1" max={d.cod_advance_type === 'percent' ? 100 : undefined} value={d.cod_advance_value} onChange={(e) => set({ cod_advance_value: e.target.value })} />
              </Field>
            </div>
            {advVal > 0 ? (
              <div className="a-ok">Example: on a {money(1000)} order the customer pays <b>{money(example)}</b> online now and <b>{money(1000 - example)}</b> on delivery.</div>
            ) : null}
            {!onlineReady ? <div className="a-warn">The advance works only when Online payment is on, a valid UPI ID is set and at least one UPI app is selected. Until then customers pay COD without advance.</div> : null}
          </>
        ) : null}
      </div>

      <div className="a-card">
        <h3>UPI apps shown to customers</h3>
        <p className="a-sub">Shown in A to Z order on the checkout and at the bottom of every page. Untick an app to hide it.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 8 }}>
          {PAY_APPS.map((a) => {
            const on = !d.hidden_apps.includes(a.n);
            return (
              <button key={a.n} type="button" onClick={() => toggleApp(a.n)} aria-pressed={on}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, textAlign: 'left',
                  border: '2px solid ' + (on ? 'var(--gr)' : 'var(--ln)'), background: on ? '#eef8ee' : '#fff', opacity: on ? 1 : 0.55 }}>
                <img src={a.src} alt="" width="34" height="34" style={{ borderRadius: 9, objectFit: 'cover' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.n}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="QR code valid for (seconds)" hint="(60 to 600)">
            <input type="number" min="60" max="600" value={d.qr_seconds} onChange={(e) => set({ qr_seconds: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="a-row end" style={{ position: 'sticky', bottom: 10 }}>
        <button className="a-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
    </>
  );
}
