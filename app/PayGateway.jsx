'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, configured } from '@/lib/supabase';
import { rs } from './data';

/* ============================================================
   Payments: settings helpers, footer strip, order payment line
   and the secure checkout (gateway) overlay.
   ============================================================ */

/* UPI apps - always shown in A to Z order. Logos live in /public/pay */
export const PAY_APPS = [
  { n: 'Amazon Pay', f: 'amazon-pay' },
  { n: 'BHIM', f: 'bhim' },
  { n: 'CRED', f: 'cred' },
  { n: 'FamApp', f: 'fam' },
  { n: 'Google Pay', f: 'google-pay' },
  { n: 'Navi', f: 'navi' },
  { n: 'Paytm', f: 'paytm' },
  { n: 'PhonePe', f: 'phonepe' },
  { n: 'super.money', f: 'super-money' },
  { n: 'WhatsApp Pay', f: 'whatsapp-pay' },
]
  .map((a) => ({ ...a, src: `/pay/${a.f}.png` }))
  .sort((a, b) => a.n.localeCompare(b.n, 'en', { sensitivity: 'base' }));

export const UPI_RE = /^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/i;

/** Turn the payment_settings row into what the shop uses.
 *  No row (SQL not run yet) = Cash on Delivery only, exactly like before. */
export function derivePay(row, brand) {
  const r = row || {};
  const hidden = Array.isArray(r.hidden_apps) ? r.hidden_apps : [];
  const apps = PAY_APPS.filter((a) => !hidden.includes(a.n));
  const upi = String(r.upi_id || '').trim();
  const cod = row ? r.cod_enabled !== false : true;
  const online = !!row && !!r.online_enabled && UPI_RE.test(upi) && apps.length > 0;
  const advVal = Number(r.cod_advance_value) || 0;
  const advType = r.cod_advance_type === 'fixed' ? 'fixed' : 'percent';
  const advOn = cod && online && !!r.cod_advance_enabled && advVal > 0;
  const secs = Math.min(600, Math.max(60, Number(r.qr_seconds) || 120));
  return {
    loaded: !!row, cod, online, upi, apps, advOn, advType, advVal, secs,
    payee: String(r.payee_name || '').trim() || brand || 'Store',
    any: cod || online,
  };
}

/** Advance amount for an order total (same maths as the SQL function). */
export function advanceFor(pay, total) {
  if (!pay.advOn || !(total > 0)) return 0;
  const a = pay.advType === 'percent'
    ? Math.round((total * Math.min(pay.advVal, 100)) / 100)
    : Math.min(Math.round(pay.advVal), total);
  return Math.min(Math.max(a, 1), total);
}

/* wording used all over the website instead of a fixed "Cash on Delivery" */
export const payShort = (pay) => (pay.cod && pay.online ? 'COD & Online Payment' : pay.online ? 'Online Payment' : 'Cash on Delivery');
export const payLine = (pay) => (pay.cod && pay.online ? 'Cash on Delivery & Online Payment available' : pay.online ? 'Online Payment (UPI) available' : 'Cash on Delivery available');
export const paySub = (pay) => (pay.cod && pay.online ? 'Pay now or on delivery' : pay.online ? 'Secure UPI payment' : 'Pay when it arrives');

export const METHOD_LABEL = { cod: 'Cash on Delivery', online: 'Online Payment (UPI)', cod_advance: 'COD with advance' };
export const methodLabel = (m) => METHOD_LABEL[String(m || 'cod').toLowerCase()] || 'Cash on Delivery';

/* ---------- icons ---------- */
const P = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2"/>',
  shield: '<path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z"/><path d="M8.500 12l2.500 2.500 4.500-5"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  card: '<rect x="2.500" y="5" width="19" height="14" rx="2.500"/><path d="M2.500 10h19M6 15h4"/>',
  cal: '<rect x="3.500" y="5" width="17" height="15" rx="2.500"/><path d="M3.500 10h17M8 3v4M16 3v4M8 14h3"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.600 5.600l12.800 12.800"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.500-6 8-6s8 2 8 6"/>',
  store: '<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 0 0 5.300 2 3 3 0 0 0 5.400 0A3 3 0 0 0 20 9M10 20v-5h4v5"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pay: '<rect x="3" y="6" width="18" height="12" rx="2.500"/><path d="M3 10h18M7 15h3"/>',
};
export const PIcon = ({ n, size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] || '' }} />
);

/* ============================================================
   Footer: "Payments supported" - shown at the bottom of every page
   ============================================================ */
export function PayStrip({ pay }) {
  if (!pay || !pay.online) return null;
  return (
    <div className="pstrip">
      <h3><PIcon n="pay" size={18} />Payments supported</h3>
      <p>Pay securely with any UPI app{pay.cod ? ', or choose Cash on Delivery' : ''}.</p>
      <ul>
        {pay.apps.map((a) => (
          <li key={a.n}>
            <img src={a.src} alt={a.n + ' logo'} width="44" height="44" loading="lazy" decoding="async" />
            {a.n}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   Payment info of orders (My Orders, Track, success page)
   ============================================================ */
export function useOrderPays(ids) {
  const [m, setM] = useState({});
  const key = (ids || []).join(',');
  useEffect(() => {
    if (!ids || !ids.length || !configured) return;
    let off = false;
    supabase.rpc('get_order_payments', { p_ids: ids.slice(0, 50) }).then(({ data, error }) => {
      if (off || error || !Array.isArray(data)) return;
      setM(Object.fromEntries(data.map((x) => [x.id, x])));
    });
    return () => { off = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return m;
}

/** Title used next to the order total: "Total · Cash on Delivery" etc. */
export const payTitle = (p) => (!p ? 'Cash on Delivery' : p.method === 'online' ? 'Online Payment' : p.method === 'cod_advance' ? 'COD with advance' : 'Cash on Delivery');

export function PayRow({ p, total }) {
  if (!p) return null;
  const m = p.method;
  const st = p.status;
  let pill = ['cod', 'Pay on delivery'];
  if (m === 'online') pill = st === 'paid' ? ['ok', 'Payment verified'] : st === 'failed' ? ['bad', 'Payment not received'] : ['wait', 'Verifying payment'];
  else if (m === 'cod_advance') pill = st === 'paid' ? ['ok', 'Advance verified'] : st === 'failed' ? ['bad', 'Advance not received'] : ['wait', 'Verifying advance'];
  else if (st === 'paid') pill = ['ok', 'Cash collected'];
  return (
    <div className="pay-row">
      <span>Payment: <b>{methodLabel(m)}</b>{p.app && m !== 'cod' ? ` via ${p.app}` : ''}</span>
      <span className={'pay-pill ' + pill[0]}>{pill[1]}</span>
      {m === 'online' ? <span>Paid online: <b>{rs(p.paid || total)}</b></span> : null}
      {m === 'cod_advance' ? <span>Advance: <b>{rs(p.paid)}</b> · Pay <b>{rs(p.due)}</b> on delivery</span> : null}
      {m === 'cod' ? <span>Pay <b>{rs(p.due || total)}</b> on delivery</span> : null}
    </div>
  );
}

/* ============================================================
   QR library (loaded only when the customer reaches the QR screen)
   ============================================================ */
function loadQR() {
  return new Promise((res, rej) => {
    if (typeof window === 'undefined') return rej(new Error('no window'));
    if (window.QRCode) return res(window.QRCode);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.async = true;
    s.onload = () => (window.QRCode ? res(window.QRCode) : rej(new Error('qr')));
    s.onerror = () => rej(new Error('qr'));
    document.head.appendChild(s);
  });
}

/* ============================================================
   Processing screen (animated). hold = keep at 96% until true work is done
   ============================================================ */
function Processing({ title, sub, steps, ms = 2600, hold = false, amount, brand, onDone }) {
  const [e, setE] = useState(0);
  const holdRef = useRef(hold);
  const doneRef = useRef(false);
  holdRef.current = hold;
  useEffect(() => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const el = Date.now() - t0;
      setE(el);
      if (el >= ms && !holdRef.current && !doneRef.current) {
        doneRef.current = true;
        clearInterval(iv);
        onDone && onDone();
      }
    }, 60);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pct = Math.min(holdRef.current ? 96 : 100, Math.round((e / ms) * 100));
  const per = ms / steps.length;
  return (
    <section className="gw-scr on gw-center gw-proc">
      <div className="gw-pill">Paying <b>{rs(amount)}</b> to <b>{brand}</b></div>
      <div className="gw-stage">
        <i className="gw-glow" /><i className="gw-rip" /><i className="gw-rip r2" /><i className="gw-ring" /><i className="gw-dash" />
        <i className="gw-orb a" /><i className="gw-orb b" /><i className="gw-orb c" />
        <div className="gw-core"><PIcon n="shield" /></div>
      </div>
      <h2>{title}</h2>
      <p className="gw-sub">{sub}</p>
      <div className="gw-flow">
        <div className="gw-fn"><div className="gw-fi"><PIcon n="user" /></div><span>You</span></div>
        <div className="gw-fl"><i /><i /><i /></div>
        <div className="gw-fn"><div className="gw-fi"><PIcon n="lock" /></div><span>Secure checkout</span></div>
        <div className="gw-fl"><i /><i /><i /></div>
        <div className="gw-fn"><div className="gw-fi"><PIcon n="store" /></div><span>{brand.length > 11 ? brand.slice(0, 10) + '…' : brand}</span></div>
      </div>
      <ul className="gw-steps">
        {steps.map((s, i) => (
          <li key={s} className={e > (i + 1) * per - 100 && !(holdRef.current && i === steps.length - 1) ? 'done' : e >= i * per ? 'act' : ''}>{s}</li>
        ))}
      </ul>
      <div className="gw-meta"><span>Please wait</span><b>{pct}%</b></div>
      <div className="gw-bar"><div style={{ width: pct + '%' }} /></div>
    </section>
  );
}

/* ============================================================
   The secure checkout overlay
   amount  = what is paid online now (full amount or the COD advance)
   balance = what is paid on delivery after an advance (0 for full online)
   onConfirm({app, utr}) must place the order and return a promise
   onSuccess() runs after the animation (parent opens the success page)
   ============================================================ */
export function Gateway({ pay, brand, tagline, logo, address, phone, email, amount, balance = 0, onClose, onConfirm, onSuccess }) {
  const [scr, setScr] = useState('boot'); // boot | methods | card | emi | qr | expired | place
  const [app, setApp] = useState(null);
  const [utr, setUtr] = useState('');
  const [err, setErr] = useState('');
  const [placed, setPlaced] = useState(false);
  const [left, setLeft] = useState(pay.secs);
  const [copied, setCopied] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [tk, setTk] = useState(0);
  const total = pay.secs;
  const busy = scr === 'place';

  const note = (brand + ' order').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 40).trim() || 'Order';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(pay.upi)}&pn=${encodeURIComponent(pay.payee.slice(0, 50))}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  useEffect(() => {
    setMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ''));
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* top ticker (honest messages only) */
  const TK = [
    ['dot', 'Secure checkout · ' + brand],
    ['bolt', 'Pay with any UPI app'],
    ['shield', 'Order is confirmed after your payment is verified'],
  ];
  useEffect(() => {
    const iv = setInterval(() => setTk((x) => x + 1), 3200);
    return () => clearInterval(iv);
  }, []);

  /* QR screen: draw the QR + countdown */
  useEffect(() => {
    if (scr !== 'qr' || !app) return;
    let off = false;
    setLeft(total);
    const el = document.getElementById('gwqr');
    if (el) {
      el.innerHTML = '';
      loadQR()
        .then((Q) => {
          if (off || !el) return;
          el.innerHTML = '';
          new Q(el, { text: upiUrl, width: 184, height: 184, colorDark: '#1a1a1a', colorLight: '#ffffff', correctLevel: Q.CorrectLevel ? Q.CorrectLevel.M : 0 });
        })
        .catch(() => {
          if (!off && el) el.innerHTML = '<div style="font-size:12px;color:#6f5a4e;padding:12px">QR could not load.<br/>Please use the UPI ID below.</div>';
        });
    }
    const iv = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) { clearInterval(iv); setScr('expired'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { off = true; clearInterval(iv); };
  }, [scr, app]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = () => {
    try { navigator.clipboard.writeText(pay.upi); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const confirm = () => {
    setErr('');
    setPlaced(false);
    setScr('place');
    Promise.resolve()
      .then(() => onConfirm({ app: app.n, utr: utr.trim() }))
      .then(() => setPlaced(true))
      .catch((e) => {
        setErr((e && e.message) || 'Could not place the order. Please try again.');
        setScr('qr');
      });
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
  const low = left <= 20;
  const t = TK[tk % TK.length];

  return (
    <div className="gw" role="dialog" aria-modal="true" aria-label="Secure checkout">
      <div className="gw-app">
        <div className="gw-tick">
          <div className="on" key={tk}>
            {t[0] === 'dot' ? <span className="gw-dot" /> : <PIcon n={t[0]} size={14} />}
            {t[1]}
          </div>
        </div>
        <div className="gw-head">
          <button className="gw-x" onClick={onClose} disabled={busy} aria-label="Close checkout"><PIcon n="close" size={18} /></button>
          <div className="gw-brand">
            <img src={logo} alt={brand + ' logo'} width="42" height="42" />
            <div><b>{brand}</b>{tagline ? <small>{tagline}</small> : <small>Secure checkout</small>}</div>
          </div>
          <div className="gw-sec"><PIcon n="lock" />Secure</div>
        </div>

        <div className="gw-main">
          {scr === 'boot' ? (
            <Processing
              title="Setting up secure checkout" sub="Please do not press back or refresh."
              steps={['Preparing your order', 'Loading merchant details', 'Getting payment options']}
              ms={2400} amount={amount} brand={brand} onDone={() => setScr('methods')}
            />
          ) : null}

          {scr === 'place' ? (
            <Processing
              title="Placing your order" sub="Saving your payment details. Please wait…"
              steps={['Saving your payment details', 'Placing your order', 'Generating your receipt']}
              ms={3000} hold={!placed} amount={amount} brand={brand} onDone={() => onSuccess && onSuccess()}
            />
          ) : null}

          {scr === 'methods' ? (
            <section className="gw-scr on">
              <div className="gw-pay"><span>{balance > 0 ? 'Advance payable now' : 'Amount payable'}</span><b>{rs(amount)}</b></div>
              {balance > 0 ? <div className="gw-note">Advance payment. The remaining <b>{rs(balance)}</b> is paid in cash when your order is delivered.</div> : null}
              <div className="gw-merch">
                <PIcon n="store" />
                <div>
                  <b>{brand}</b><br />
                  {address ? <>{address}<br /></> : null}
                  {phone ? <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a> : null}{phone && email ? ' · ' : ''}
                  {email ? <a href={`mailto:${email}`}>{email}</a> : null}
                </div>
              </div>
              <div className="gw-lbl">PAY WITH UPI APP</div>
              <div className="gw-grid">
                {pay.apps.map((a) => (
                  <button key={a.n} className="gw-app-t" onClick={() => { setApp(a); setErr(''); setScr('qr'); }}>
                    <span className="gw-ic"><img src={a.src} alt="" width="52" height="52" /></span>{a.n}
                  </button>
                ))}
              </div>
              <div className="gw-lbl">OTHER METHODS</div>
              <button className="gw-opt" onClick={() => setScr('card')}><span className="oi"><PIcon n="card" /></span><span><b>Debit / Credit Card</b><small>Visa, Mastercard, RuPay</small></span><em>›</em></button>
              <button className="gw-opt" onClick={() => setScr('emi')}><span className="oi"><PIcon n="cal" /></span><span><b>EMI</b><small>Pay in easy installments</small></span><em>›</em></button>
            </section>
          ) : null}

          {scr === 'card' ? (
            <section className="gw-scr on gw-center">
              <div className="gw-badge red"><PIcon n="ban" /></div>
              <h2>Feature Not Available</h2>
              <p className="gw-sub">Card payments are currently unavailable.<br />Please choose another payment method.</p>
              <button className="gw-btn" onClick={() => setScr('methods')}>Choose Another Method</button>
            </section>
          ) : null}

          {scr === 'emi' ? (
            <section className="gw-scr on gw-center">
              <div className="gw-badge blu"><PIcon n="clock" /></div>
              <h2>Coming Soon</h2>
              <p className="gw-sub">EMI option is coming soon.<br />We are working hard to bring it to you.</p>
              <button className="gw-btn" onClick={() => setScr('methods')}>Back to Payment Methods</button>
            </section>
          ) : null}

          {scr === 'qr' && app ? (
            <section className="gw-scr on">
              <div className="gw-qtop">
                <button className="gw-x" onClick={() => setScr('methods')} aria-label="Back"><PIcon n="back" size={18} /></button>
                <div className="gw-qapp"><span className="gw-ic"><img src={app.src} alt="" width="38" height="38" /></span><div><small>Paying with</small><b>{app.n}</b></div></div>
              </div>
              <div className="gw-qamt"><span>{balance > 0 ? 'Advance to pay' : 'Amount to pay'}</span><b>{rs(amount)}</b></div>
              {err ? <div className="gw-err" role="alert">{err}</div> : null}
              <div className="gw-qcard">
                <div className="gw-qframe"><u /><u /><u /><u />
                  <div id="gwqr" />
                  <div className="gw-scan" />
                  <div className="gw-qlogo"><img src={app.src} alt="" /></div>
                </div>
                <p>Open <b>{app.n}</b> or any UPI app, scan this QR and confirm the payment. Then tap <b>I have paid</b>.</p>
                <div className="gw-payee"><span>Payee</span><b>{pay.payee}</b></div>
                <button className={'gw-upi' + (copied ? ' ok' : '')} onClick={copy}>
                  <span>{copied ? 'Copied' : pay.upi}</span><PIcon n="copy" />
                </button>
              </div>
              <div className="gw-time">
                <svg className="gw-tr" viewBox="0 0 44 44"><circle className="bg" cx="22" cy="22" r="19" /><circle className={'fg' + (low ? ' low' : '')} cx="22" cy="22" r="19" style={{ strokeDashoffset: (1 - left / total) * 119.4 }} /></svg>
                <div><small>QR expires in</small><div className={'gw-timer' + (low ? ' low' : '')}>{mm}</div></div>
                <div className="gw-wait"><i />Waiting for payment</div>
              </div>
              {mobile ? <a className="gw-link" href={upiUrl}><PIcon n="bolt" size={18} />Pay with UPI app on this phone</a> : null}
              <div className="gw-utr">
                <label htmlFor="gwutr">UTR / Transaction ID <em>(optional, helps us verify faster)</em></label>
                <input id="gwutr" value={utr} inputMode="text" autoComplete="off" maxLength={22} placeholder="e.g. 412345678901" onChange={(e) => setUtr(e.target.value.replace(/[^A-Za-z0-9]/g, ''))} />
              </div>
              <button className="gw-btn green" onClick={confirm}><PIcon n="check" size={18} />I have paid</button>
              <button className="gw-btn ghost" onClick={() => setScr('methods')}>Change Payment Method</button>
            </section>
          ) : null}

          {scr === 'expired' ? (
            <section className="gw-scr on gw-center">
              <div className="gw-badge amb"><PIcon n="clock" /></div>
              <h2>Payment QR Expired</h2>
              <p className="gw-sub">This QR code is no longer valid.<br />Please generate a new one to continue.</p>
              <button className="gw-btn" onClick={() => setScr('qr')}>Retry Payment</button>
              <button className="gw-btn ghost" onClick={() => setScr('methods')}>Change Payment Method</button>
            </section>
          ) : null}
        </div>

        <div className="gw-foot">
          <div className="gw-tb">
            <span><PIcon n="lock" />Secure checkout</span>
            <span><PIcon n="bolt" />Direct UPI payment</span>
            <span><PIcon n="shield" />Verified before confirmation</span>
          </div>
          <p>© {new Date().getFullYear()} {brand}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
