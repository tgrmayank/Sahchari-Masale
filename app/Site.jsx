'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter as useNextRouter, usePathname as useNextPathname } from 'next/navigation';
import logo from './logo.png';
import procSourcing from './process-1-sourcing.png';
import procSelection from './process-2-selection.png';
import procProcessing from './process-3-processing.png';
import procPackaging from './process-4-packaging.png';
import procKitchen from './process-5-kitchen.png';
import { supabase, configured } from '@/lib/supabase';
import {
  IC, ST, SD, SI, rs, pimg, cimg, packInfo, chk, computeBill, fdate, buildCatalog, mapCoupon,
} from './data';

const DEFAULT_LOGO = logo.src || logo;

/* Catalog (settings, categories, products, banners, coupons) - loaded from Supabase */
const CatCtx = createContext(null);
const useCat = () => useContext(CatCtx);

/* ---------- Real URL routing (/cart, /orders, /product/3 ...) - koi # nahi ---------- */
const toPath = (h) => (h.startsWith('/') ? h : '/' + h);

function Link({ href, children, ...rest }) {
  return <NextLink href={toPath(href)} {...rest}>{children}</NextLink>;
}
function useRouter() {
  const r = useNextRouter();
  return useMemo(() => ({
    push: (h) => r.push(toPath(h)),
    replace: (h) => r.replace(toPath(h)),
  }), [r]);
}
// null = abhi browser me load nahi hua
function usePathname() {
  const np = useNextPathname();
  const r = useNextRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    // purane shared links (site.in/#/product/3) ko naye URL par bhej do
    const h = window.location.hash;
    if (h.startsWith('#/')) r.replace(h.slice(1));
    setOk(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return ok ? (np || '/') : null;
}

/* ===== Icon ===== */
function Icon({ name, size = 20, color, className, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={color ? { color, ...style } : style}
      dangerouslySetInnerHTML={{ __html: IC[name] }}
    />
  );
}

/* ===== BrandIcons ===== */
function IgIcon({ size = 22, color = '#fff' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill={color} />
    </svg>
  );
}

function WaIcon({ size = 22, color = '#fff' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm4.9 13.6c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.8-4.6-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.7 1.1 1.5 1.9 2.7 2.5.3.1.4.1.6-.1l.7-.9c.2-.2.3-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z" />
    </svg>
  );
}

/* ===== Social ===== */
function Social() {
  const { WA, IG, MAP } = useCat();
  return (
    <div className="soc">
      {IG ? (
        <a href={IG} target="_blank" rel="noopener" aria-label="Instagram"
           style={{ background: 'linear-gradient(45deg,#f9a03f,#e1306c,#833ab4)' }}>
          <IgIcon />
        </a>
      ) : null}
      {WA ? (
        <>
          <a href={`https://wa.me/${WA}`} target="_blank" rel="noopener" aria-label="WhatsApp"
             style={{ background: '#25d366' }}>
            <WaIcon />
          </a>
          <a href={`tel:+${WA}`} aria-label="Call" style={{ background: '#1976d2' }}>
            <Icon name="phone" size={22} color="#fff" />
          </a>
        </>
      ) : null}
      {MAP ? (
        <a href={MAP} target="_blank" rel="noopener" aria-label="Google Maps location"
           style={{ background: '#ea4335' }}>
          <Icon name="pin" size={22} color="#fff" />
        </a>
      ) : null}
    </div>
  );
}

/* ===== Stars ===== */
function Stars({ r, size = 16 }) {
  const n = Math.round(r);
  return (
    <span className="sg" role="img" aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} className={i <= n ? 'f' : ''} />
      ))}
    </span>
  );
}

/* ===== Countdown ===== */
const fmt = () => {
  const n = new Date();
  const e = new Date(n);
  e.setHours(24, 0, 0, 0);
  const s = Math.floor((e - n) / 1000);
  return [(s / 3600) | 0, ((s % 3600) / 60) | 0, s % 60]
    .map((x) => String(x).padStart(2, '0'))
    .join(':');
};

/* "Offer ends in hh:mm:ss" - counts down to midnight */
function Countdown() {
  const [t, setT] = useState('');
  useEffect(() => {
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tm">
      <Icon name="clock" size={12} />
      <b>{t ? 'Offer ends in ' + t : 'Offer ends today'}</b>
    </span>
  );
}

/* ===== PageHead ===== */
function PageHead({ icon, title, sub }) {
  return (
    <div className="ph">
      <i><Icon name={icon} size={24} /></i>
      <div>
        <h2>{title}</h2>
        {sub ? <p>{sub}</p> : null}
      </div>
    </div>
  );
}

/* ===== Crumb ===== */
function Crumb({ title }) {
  return (
    <nav className="crumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <Icon name="next" size={14} />
      <span aria-current="page">{title}</span>
    </nav>
  );
}

/* ===== Steps ===== */
function Steps({ n }) {
  return (
    <ol className="stp">
      {['Cart', 'Address', 'Payment'].map((s, i) => (
        <li key={s} className={i < n ? 'dn' : i === n ? 'on' : ''}>
          <i>{i < n ? <Icon name="check" size={15} /> : i + 1}</i>
          {s}
        </li>
      ))}
    </ol>
  );
}

/* ===== Empty ===== */
function Empty({ icon, title, text, shop = false, children }) {
  return (
    <div className="box emp">
      <i><Icon name={icon} size={40} /></i>
      <h3>{title}</h3>
      <p>{text}</p>
      {shop ? (
        <Link className="btn" href="/">
          <Icon name="bag" size={18} />Start shopping
        </Link>
      ) : null}
      {children}
    </div>
  );
}

/* ===== ProcessSection (From Farm To Family) ===== */
const PROCESS_STEPS = [
  { img: procSourcing, tag: 'Step 01 / Sourcing', t: 'Freshness Begins At The Source',
    d: 'Our journey begins with carefully sourced fresh chillies and quality ingredients. We value the natural freshness and quality of every spice that becomes part of Sahchari Masale.', k: 'Fresh Ingredients' },
  { img: procSelection, tag: 'Step 02 / Selection', t: 'Handpicked Spices, Authentic Flavours',
    d: 'Every ingredient is carefully inspected and selected for its aroma, freshness and quality. We bring together carefully chosen spices to create the authentic taste of Indian cooking.', k: 'Selected With Care' },
  { img: procProcessing, tag: 'Step 03 / Processing', t: 'Perfectly Ground For Rich Aroma',
    d: 'Selected whole spices are processed using modern grinding machinery. Our focus is to preserve the natural colour, rich aroma and distinctive flavour of every spice.', k: 'Quality Processing' },
  { img: procPackaging, tag: 'Step 04 / Packaging', t: 'Sealed With Care, Packed With Quality',
    d: 'Our spices are carefully packed using packaging machinery to help maintain their freshness, aroma and quality. Every Sahchari Masale packet is prepared with attention to detail.', k: 'Freshness In Every Pack' },
  { img: procKitchen, tag: 'Step 05 / Your Kitchen', t: 'Bringing Happiness To Every Kitchen',
    d: 'From our careful selection of ingredients to your favourite homemade recipes, Sahchari Masale brings colour, aroma and authentic Indian flavour to your everyday cooking.', k: 'Made For Your Family' },
];

const PROCESS_CSS = `
.fts{max-width:1100px;margin:0 auto;padding:clamp(36px,8vw,80px) 14px clamp(30px,6vw,60px);text-align:center}
.fts-hd h2{font-family:'Playfair Display',Georgia,serif;font-weight:500;color:#1b4332;font-size:clamp(28px,6vw,46px);line-height:1.2;margin:0 0 12px}
.fts-hd p{color:#6b6b6b;font-size:clamp(13px,2.4vw,16px);line-height:1.8;max-width:900px;margin:0 auto}
.fts-row{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:clamp(14px,6vw,90px);padding:clamp(28px,9vw,100px) 0;text-align:left}
.fts-row.rev .fts-im{order:2}
.fts-im{display:flex;align-items:center;justify-content:center}
.fts-im img{width:100%;height:auto;display:block;border:0;border-radius:0;box-shadow:none;background:none}
.fts-tx small{display:block;color:#9a6b1a;font-size:clamp(8px,1.6vw,12px);font-weight:700;letter-spacing:.2em;text-transform:uppercase;margin-bottom:clamp(8px,2vw,18px)}
.fts-tx h3{font-family:'Playfair Display',Georgia,serif;font-weight:500;color:#1b4332;font-size:clamp(18px,4.2vw,34px);line-height:1.25;margin:0 0 clamp(8px,2vw,18px)}
.fts-tx p{color:#6b6b6b;font-size:clamp(11px,2.1vw,15px);line-height:1.95;margin:0 0 clamp(10px,2vw,18px)}
.fts-tx em{display:block;font-style:normal;color:#9a6b1a;font-size:clamp(7px,1.5vw,11px);font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.fts-ft{padding-top:clamp(20px,6vw,60px)}
.fts-ft h2{font-family:'Playfair Display',Georgia,serif;font-weight:500;color:#1b4332;font-size:clamp(24px,5.4vw,44px);line-height:1.25;margin:0 0 12px}
.fts-ft p{color:#6b6b6b;font-size:clamp(12px,2.2vw,15px);line-height:1.8;max-width:900px;margin:0 auto}
`;

function ProcessSection() {
  return (
    <section className="fts" aria-label="From farm to family">
      <style>{PROCESS_CSS}</style>
      <div className="fts-hd">
        <h2>From Farm To Family</h2>
        <p>Every spice has a story. Discover how we carefully source, select, process and pack authentic Indian spices to bring real aroma and flavour to your kitchen.</p>
      </div>
      {PROCESS_STEPS.map((st, i) => (
        <div key={i} className={'fts-row' + (i % 2 ? ' rev' : '')}>
          <div className="fts-im">
            <img src={st.img.src || st.img} alt={st.t} loading="lazy" />
          </div>
          <div className="fts-tx">
            <small>{st.tag}</small>
            <h3>{st.t}</h3>
            <p>{st.d}</p>
            <em>{st.k}</em>
          </div>
        </div>
      ))}
      <div className="fts-ft">
        <h2>The Taste Of Tradition, The Promise Of Quality.</h2>
        <p>Sahchari Masale — Bringing authentic Indian flavours and the joy of traditional cooking closer to every family.</p>
      </div>
    </section>
  );
}

/* ===== WhySection ===== */
const WHY_ICONS = ['leaf', 'shield', 'truck', 'cash', 'star', 'box', 'tag', 'bolt'];

function WhySection() {
  const { S, BN, WA } = useCat();
  return (
    <section className="why">
      <h2>Why {BN}</h2>
      <div className="wg">
        {(S.why_items || []).map((w, i) => (
          <div key={i}>
            <i><Icon name={WHY_ICONS[i % WHY_ICONS.length]} size={24} /></i>
            <b>{w.t}</b>
            {w.s}
          </div>
        ))}
      </div>
      <div className="help">
        <div>
          <h3>Need help with your order?</h3>
          <p>Talk to us directly, we reply quickly.</p>
        </div>
        <div className="acts">
          <a className="btn g" href={`tel:+${WA}`}><Icon name="phone" size={18} />Call Now</a>
          <a className="btn o" href={`https://wa.me/${WA}`} target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    </section>
  );
}

/* ===== StoreProvider ===== */
const Ctx = createContext(null);
export { Ctx };
const useStore = () => useContext(Ctx);

const load = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || d;
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

const EMPTY_RAW = { settings: null, cats: [], products: [], slides: [], coupons: [], ratings: [] };

function StoreProvider({ children }) {
  /* persisted in this browser only: cart, address, coupon, own order IDs */
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState([]); // [{id, k (pack index), q}]
  const [orderIds, setOrderIds] = useState([]);
  const [addr, setAddr] = useState({});
  const [coupon, setCoupon] = useState('');

  /* catalog from Supabase */
  const [raw, setRaw] = useState(null); // null = still loading
  const [loadErr, setLoadErr] = useState('');
  const [extra, setExtra] = useState({}); // hidden coupons found by code

  /* session only */
  const [filters, setFilters] = useState({ q: '', c: 'All', s: '', t: '' });
  const [toast, setToast] = useState({ msg: '', on: false });
  const timer = useRef(null);

  useEffect(() => {
    setCart(load('sm_cart', []));
    setOrderIds(load('sm_oids', []));
    setAddr(load('sm_addr', {}));
    setCoupon(load('sm_coupon', ''));
    setReady(true);

    // keep tabs in sync
    const onStorage = (e) => {
      if (e.key === 'sm_cart') setCart(load('sm_cart', []));
      if (e.key === 'sm_oids') setOrderIds(load('sm_oids', []));
      if (e.key === 'sm_addr') setAddr(load('sm_addr', {}));
      if (e.key === 'sm_coupon') setCoupon(load('sm_coupon', ''));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => { if (ready) save('sm_cart', cart); }, [ready, cart]);
  useEffect(() => { if (ready) save('sm_oids', orderIds); }, [ready, orderIds]);
  useEffect(() => { if (ready) save('sm_addr', addr); }, [ready, addr]);
  useEffect(() => { if (ready) save('sm_coupon', coupon); }, [ready, coupon]);

  /* ---------- load the shop from Supabase ---------- */
  useEffect(() => {
    let off = false;
    (async () => {
      if (!configured) {
        setLoadErr('Supabase keys are missing in the .env file');
        setRaw(EMPTY_RAW);
        return;
      }
      try {
        const sel = (t) => supabase.from(t).select('*');
        const res = await Promise.all([
          sel('site_settings').eq('id', 1).maybeSingle(),
          sel('categories').eq('is_active', true).order('sort_order').order('id'),
          sel('products').eq('is_active', true).order('sort_order').order('id'),
          sel('hero_slides').eq('is_active', true).order('sort_order').order('id'),
          sel('coupons').eq('is_active', true),
          sel('product_ratings'),
        ]);
        const bad = res.find((r) => r.error);
        if (bad) throw bad.error;
        if (off) return;
        setRaw({
          settings: res[0].data,
          cats: res[1].data || [],
          products: res[2].data || [],
          slides: res[3].data || [],
          coupons: res[4].data || [],
          ratings: res[5].data || [],
        });
      } catch (e) {
        if (off) return;
        setLoadErr((e && e.message) || 'Could not load the shop');
        setRaw(EMPTY_RAW);
      }
    })();
    return () => { off = true; };
  }, []);

  const cat = useMemo(() => {
    const c = buildCatalog(raw || EMPTY_RAW, extra);
    return { ...c, LOGO: c.S.logo_url || DEFAULT_LOGO, loaded: raw !== null, loadErr };
  }, [raw, extra, loadErr]);

  // hidden coupons are not listed publicly - look them up by code
  const ensureCoupon = useCallback(async (code) => {
    code = (code || '').trim().toUpperCase();
    if (!code || !configured) return null;
    const { data, error } = await supabase.rpc('lookup_coupon', { p_code: code });
    if (error || !data) return null;
    const cp = mapCoupon(data, data.category_name);
    setExtra((x) => ({ ...x, [cp.c]: cp }));
    return cp;
  }, []);

  /* ---------- toast ---------- */
  const hideToast = useCallback(() => {
    clearTimeout(timer.current);
    setToast((t) => (t.on ? { ...t, on: false } : t));
  }, []);
  const showToast = useCallback((msg, ms = 3500) => {
    setToast({ msg, on: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, on: false })), ms);
  }, []);
  useEffect(() => {
    if (ready && !cart.length) hideToast();
  }, [ready, cart.length, hideToast]);

  /* ---------- cart ---------- */
  const count = cart.reduce((a, c) => a + c.q, 0);

  // add `q` of product `id` in pack `k`
  const addLine = useCallback((id, k, q) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.id == id && x.k == k);
      if (i < 0) return [...c, { id, k, q }];
      return c.map((x, j) => (j === i ? { ...x, q: x.q + q } : x));
    });
  }, []);

  // +/- on the first pack (cards on home / suggestions)
  const bumpBase = useCallback((id, d) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.id == id && x.k == 0);
      if (i < 0) return d > 0 ? [...c, { id, k: 0, q: 1 }] : c;
      return c.map((x, j) => (j === i ? { ...x, q: x.q + d } : x)).filter((x) => x.q >= 1);
    });
  }, []);

  // +/- on a cart row by index (use -99 to remove)
  const changeQty = useCallback((index, d) => {
    setCart((c) => c.map((x, j) => (j === index ? { ...x, q: x.q + d } : x)).filter((x) => x.q >= 1));
  }, []);

  /* ---------- orders (saved in Supabase; price is re-checked on the server) ---------- */
  const placeOrder = async () => {
    const items = cart.map((c) => ({ pid: c.id, k: c.k, q: c.q }));
    const { data, error } = await supabase.rpc('place_order', {
      p_items: items,
      p_addr: addr,
      p_coupon: coupon || null,
    });
    if (error) throw new Error(error.message);
    setOrderIds((o) => [data.id, ...o.filter((x) => x !== data.id)]);
    setCart([]);
    setCoupon('');
    return data.id;
  };

  const value = {
    ready, cart, orderIds, addr, coupon, count,
    setAddr, setCoupon, addLine, bumpBase, changeQty, placeOrder, ensureCoupon,
    filters, setFilters, toast, showToast, hideToast,
  };
  return (
    <CatCtx.Provider value={cat}>
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </CatCtx.Provider>
  );
}

/* ===== Marquee ===== */
function Marquee() {
  const { S } = useCat();
  if (!(S.announcements || []).length) return null;
  return (
    <div className="mq" aria-label="Announcements">
      <div>
        {(S.announcements || []).map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ===== MiniHeader ===== */
function MiniHeader() {
  const { BN, LOGO } = useCat();
  return (
    <header className="mini" style={{ display: 'block' }}>
      <Link href="/">
        <img className="lg" src={LOGO} alt={BN + ' logo'} />
        {BN}
      </Link>
    </header>
  );
}

/* ===== Hero ===== */
const SLIDE_BG = 'radial-gradient(circle at 80% 20%,#8a2218,transparent 55%),linear-gradient(135deg,#5a1010,#2d0707)';

function Slide({ s }) {
  const { setFilters } = useStore();
  const [bad, setBad] = useState(false);
  const open = () => {
    if (!s.c) return;
    setFilters((f) => ({ ...f, c: s.c }));
    const el = document.querySelector('.shop');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <div className="sl" style={{ '--g': SLIDE_BG, cursor: s.c ? 'pointer' : 'default' }} onClick={open}>
      {s.img && !bad ? <img className="bgi" src={s.img} alt={s.t || ''} onError={() => setBad(true)} /> : null}
    </div>
  );
}

function Hero() {
  const { BN, SL, LOGO } = useCat();
  const slides = SL.length ? SL : [{ id: 0, t: '', s: '', c: '', img: '' }];
  const N = slides.length;
  const [hn, setHn] = useState(0);
  const [snap, setSnap] = useState(false);
  const hnRef = useRef(0);
  const timer = useRef(null);
  const x0 = useRef(0);

  const move = useCallback((n) => {
    hnRef.current = n;
    setHn(n);
  }, []);

  const show = useCallback(
    (i) => {
      if (i >= N) {
        // slide onto the cloned first slide, then silently jump back to 0
        move(N);
        setTimeout(() => {
          setSnap(true);
          move(0);
          requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
        }, 950);
        return;
      }
      move((i + N) % N);
    },
    [N, move]
  );

  const stop = useCallback(() => {
    clearInterval(timer.current);
    timer.current = null;
  }, []);
  const go = useCallback(() => {
    stop();
    if (N < 2) return;
    timer.current = setInterval(() => show(hnRef.current + 1), 5000);
  }, [stop, show, N]);

  useEffect(() => {
    go();
    return stop;
  }, [go, stop]);

  return (
    <section
      className="hero"
      id="hero"
      aria-label="Featured offers"
      onMouseEnter={stop}
      onMouseLeave={go}
      onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const d = e.changedTouches[0].clientX - x0.current;
        if (Math.abs(d) > 40 && hnRef.current < N) {
          show(hnRef.current + (d < 0 ? 1 : -1));
          go();
        }
      }}
    >
      <div
        className="sls"
        style={{
          transform: `translateX(-${hn * 100}%)`,
          transition: snap ? 'none' : undefined,
        }}
      >
        {slides.map((s) => <Slide key={s.id} s={s} />)}
        <Slide key="clone" s={slides[0]} />
      </div>
      <div className="bro">
        <img src={LOGO} alt={BN + ' logo'} />
        <h1>{BN}</h1>
      </div>
    </section>
  );
}

/* ===== BottomNav ===== */
const ITEMS = [
  ['/', 'home', 'Home'],
  ['/track', 'truck', 'Track Order'],
  ['/cart', 'cart', 'Cart'],
  ['/orders', 'bag', 'My Orders'],
  ['/contact', 'phone', 'Contact'],
];

// which tab is highlighted for which route
const ACTIVE = {
  '': '/', product: '/', cart: '/cart', address: '/cart', payment: '/cart',
  track: '/track', 'order-success': '/orders', orders: '/orders', contact: '/contact',
};

function BottomNav() {
  const pathname = usePathname() || '/';
  const { count, ready } = useStore();
  const seg = pathname.split('/')[1] || '';
  const on = ACTIVE[seg];
  return (
    <nav id="nav" aria-label="Main navigation">
      {ITEMS.map((a) => (
        <Link key={a[0]} href={a[0]} className={a[0] === on ? 'on' : ''}>
          <Icon name={a[1]} size={22} />
          {a[2]}
          {a[0] === '/cart' && ready && count ? <b>{count}</b> : null}
        </Link>
      ))}
    </nav>
  );
}

/* ===== BackToTopBtn ===== */
function BackToTopBtn() {
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <Icon name="up" size={14} />Back to top
    </button>
  );
}

/* ===== Footer ===== */
/* ===== LegalInfo (manufacturer, GST, FSSAI, Make in India) ===== */
const LEGAL = {
  name: 'SAHCHARI MASALE',
  addr: 'Mat Mulla Bangar, P.O. - Mat, Distt. Mathura, U.P.-281202',
  gst: '09CQBPD3237M1ZS',
  fssai: '22726130000127',
  best: '12 months from date of packaging',
  phone: '+91-8368752030',
  mail: 'sahcharimasale@gmail.com',
};

const LEGAL_CSS = `
.lgi{max-width:1100px;margin:22px auto 0;padding-top:20px;border-top:1px solid #d9a21b55}
.lgi-top{display:grid;gap:18px}
.lgi-by small{display:block;color:#d9a21b;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px}
.lgi-by b{display:block;font-family:var(--f-head);font-size:20px;letter-spacing:.06em;color:#fff;line-height:1.2}
.lgi-by span{display:block;margin-top:6px;font-size:13px;line-height:1.6;color:#f7e6b8}
.lgi-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.lgi-grid div{background:#ffffff0d;border:1px solid #d9a21b33;border-radius:10px;padding:10px 12px;min-width:0}
.lgi-grid small{display:block;color:#d9a21b;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px}
.lgi-grid em{display:block;font-style:normal;color:#fff;font-size:13px;font-weight:500;line-height:1.45;word-break:break-word}
.lgi-grid .wide{grid-column:1/-1}
.lgi-bd{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch}
.lgi-bd figure{margin:0;background:#fff;border-radius:10px;padding:8px 12px;display:flex;align-items:center;justify-content:center;flex:1 1 140px;min-height:62px}
.lgi-bd svg{display:block;height:46px;width:auto;max-width:100%}
@media(min-width:760px){.lgi-top{grid-template-columns:1fr 1.4fr;align-items:start}.lgi-grid{grid-template-columns:repeat(3,1fr)}.lgi-grid .wide{grid-column:auto}.lgi-bd{grid-column:1/-1;justify-content:center}.lgi-bd figure{flex:0 1 190px}}
`;

function GstBadge() {
  return (
    <svg viewBox="0 0 150 46" role="img" aria-label="GST - Goods and Services Tax">
      <text x="75" y="26" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="800" fontSize="28" fill="#1a237e" letterSpacing="2">GST</text>
      <rect x="22" y="31" width="35" height="3" fill="#ff9933" />
      <rect x="57" y="31" width="36" height="3" fill="#d7d7d7" />
      <rect x="93" y="31" width="35" height="3" fill="#138808" />
      <text x="75" y="43" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="600" fontSize="8" fill="#37474f" letterSpacing=".6">GOODS &amp; SERVICES TAX</text>
    </svg>
  );
}
function FssaiBadge() {
  return (
    <svg viewBox="0 0 150 46" role="img" aria-label="FSSAI licensed">
      <circle cx="22" cy="21" r="14" fill="#fff" stroke="#138808" strokeWidth="3" />
      <path d="M14 22c4-9 12-9 16-1-4 6-12 6-16 1z" fill="#f57c00" />
      <circle cx="22" cy="21" r="3" fill="#138808" />
      <text x="42" y="25" fontFamily="Arial,Helvetica,sans-serif" fontWeight="800" fontSize="25" fill="#138808" letterSpacing="-.5">fssai</text>
      <text x="42" y="38" fontFamily="Arial,Helvetica,sans-serif" fontWeight="600" fontSize="8.5" fill="#37474f">Lic. No. {LEGAL.fssai}</text>
    </svg>
  );
}
function MakeInIndiaBadge() {
  return (
    <svg viewBox="0 0 150 46" role="img" aria-label="Make in India">
      <rect x="4" y="5" width="142" height="4" fill="#ff9933" />
      <rect x="4" y="9" width="142" height="4" fill="#e8e8e8" />
      <rect x="4" y="13" width="142" height="4" fill="#138808" />
      <text x="75" y="33" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="800" fontSize="17" fill="#212121" letterSpacing="1.2">MAKE IN INDIA</text>
      <text x="75" y="42.5" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="600" fontSize="7" fill="#546e7a" letterSpacing="1.4">PROUDLY MADE IN BHARAT</text>
    </svg>
  );
}

function LegalInfo() {
  return (
    <section className="lgi" aria-label="Manufacturer and license details">
      <style>{LEGAL_CSS}</style>
      <div className="lgi-top">
        <div className="lgi-by">
          <small>Manufactured &amp; Marketed By:</small>
          <b>{LEGAL.name}</b>
          <span>{LEGAL.addr}</span>
        </div>
        <div className="lgi-grid">
          <div><small>GST No.</small><em>{LEGAL.gst}</em></div>
          <div><small>FSSAI Lic. No.</small><em>{LEGAL.fssai}</em></div>
          <div className="wide"><small>Best Before</small><em>{LEGAL.best}</em></div>
          <div><small>Customer Care No.</small><em><a href={`tel:${LEGAL.phone.replace(/[^+\d]/g, '')}`}>{LEGAL.phone}</a></em></div>
          <div className="wide"><small>E-mail</small><em><a href={`mailto:${LEGAL.mail}`}>{LEGAL.mail}</a></em></div>
        </div>
        <div className="lgi-bd">
          <figure><GstBadge /></figure>
          <figure><FssaiBadge /></figure>
          <figure><MakeInIndiaBadge /></figure>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { BN, TAGLINE, PH, WA, MAIL, IG, IGH, ADDR, LOGO } = useCat();
  return (
    <footer id="ft">
      <div className="in">
        <div>
          <div className="fb">
            <img className="lg" src={LOGO} alt={BN + ' logo'} />
            <div>
              <h3 style={{ margin: 0 }}>{BN}</h3>
              {TAGLINE ? <small>{TAGLINE}</small> : null}
            </div>
          </div>
          {ADDR ? <p style={{ marginTop: 12 }}><Icon name="pin" size={16} />{ADDR}</p> : null}
          {PH ? <p><Icon name="phone" size={16} /><a href={`tel:+${WA}`}>{PH}</a></p> : null}
          {MAIL ? <p><Icon name="mail" size={16} /><a href={`mailto:${MAIL}`}>{MAIL}</a></p> : null}
          {IG ? (
            <p>
              <IgIcon size={16} color="#d9a21b" />
              <a href={IG} target="_blank" rel="noopener">{IGH || 'Instagram'}</a>
            </p>
          ) : null}
        </div>
        <div>
          <h3>Quick Links</h3>
          <div className="fl">
            <Link href="/"><Icon name="home" size={15} />Home</Link>
            <Link href="/track"><Icon name="truck" size={15} />Track Order</Link>
            <Link href="/cart"><Icon name="cart" size={15} />Cart</Link>
            <Link href="/orders"><Icon name="bag" size={15} />My Orders</Link>
            <Link href="/contact"><Icon name="phone" size={15} />Contact</Link>
            <Link href="/terms"><Icon name="file" size={15} />Terms &amp; Conditions</Link>
            <Link href="/privacy"><Icon name="lock" size={15} />Privacy Policy</Link>
          </div>
        </div>
        <div>
          <h3>Connect With Us</h3>
          <Social />
          <p style={{ marginTop: 14 }}><Icon name="cash" size={16} />Cash on Delivery available</p>
        </div>
      </div>
      <LegalInfo />
      <div className="cp">
        <span suppressHydrationWarning>© {new Date().getFullYear()} {BN}. All rights reserved.</span>
        <BackToTopBtn />
      </div>
    </footer>
  );
}

/* ===== Toast ===== */
function Toast() {
  const { toast } = useStore();
  const router = useRouter();
  return (
    <div className={'toast' + (toast.on ? ' on' : '')} id="toast" role="status">
      <span id="tt">{toast.msg}</span>
      <button onClick={() => router.push('/cart')}>View Cart</button>
    </div>
  );
}

/* ===== DiwaliBanner (home page top: offer + lights + 3D diya animation) ===== */
const DIWALI = {
  show: true,               // false karoge to banner hat jayega
  until: '2026-11-15',      // is date ke baad banner apne aap band
  label: 'Happy Diwali',
  title: 'Diwali Special Offer',
  text: 'Pure & fresh masale at special festive prices!',
  cta: 'Shop Now',
};
const DW_COLORS = ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#ff80ab', '#ffab40'];
const DW_SPARKS = [
  [6, 52, 0],
  [22, 66, 0.6],
  [36, 50, 1.1],
  [62, 56, 0.3],
  [78, 64, 1.5],
  [93, 50, 0.9],
  [50, 68, 1.8],
];

const DW_CSS = `
.dwl{position:relative;overflow:hidden;background:radial-gradient(120% 150% at 50% 0%,#8e2a14 0%,#5a1010 50%,#2c0707 100%);color:#fff;border-bottom:3px solid #d9a21b;isolation:isolate}
.dwl-lt{list-style:none;display:flex;margin:0;padding:0 2px;height:30px;position:relative;z-index:3}
.dwl-lt li{position:relative;flex:1;min-width:0}
.dwl-lt li::before{content:'';position:absolute;left:-1px;right:-1px;top:-8px;height:15px;border-bottom:2px solid #7a5217;border-radius:0 0 50% 50%}
.dwl-lt i{position:absolute;left:50%;top:6px;width:9px;height:14px;margin-left:-4.5px;border-radius:50% 50% 50% 50%/38% 38% 62% 62%;background:radial-gradient(circle at 35% 28%,#fffc 0 14%,var(--c) 52%);animation:dwl-bulb 1.4s ease-in-out infinite;animation-delay:var(--d)}
.dwl-lt i::before{content:'';position:absolute;left:50%;top:-4px;width:6px;height:5px;margin-left:-3px;background:#4a3210;border-radius:1px}
.dwl-cf{position:absolute;top:-26px;width:84px;height:84px;z-index:2;pointer-events:none;background:radial-gradient(circle,#fff6d6 0 7%,#ffd54acc 18%,#ff9a0044 45%,transparent 70%);animation:dwl-flare 1.4s ease-in-out infinite}
.dwl-cf.l{left:-26px}.dwl-cf.r{right:-26px;animation-delay:.7s}
.dwl-sp{position:absolute;z-index:1;width:9px;height:9px;background:#ffe9a8;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);opacity:0;animation:dwl-tw 2.6s ease-in-out infinite}
.dwl-in{position:relative;z-index:2;max-width:860px;margin:0 auto;padding:2px 10px 12px;display:flex;align-items:center;justify-content:center;gap:clamp(6px,3vw,26px)}
.dwl-pr{flex:0 0 auto;width:clamp(48px,13vw,92px);perspective:320px}
.dwl-d{display:block;width:100%;height:auto;overflow:visible;filter:drop-shadow(0 7px 5px #000a);transform-style:preserve-3d;animation:dwl-sway 5.5s ease-in-out infinite}
.dwl-d.b{animation-delay:-2.7s}
.dwl-halo{transform-box:fill-box;transform-origin:50% 50%;opacity:0;animation:dwl-lit 7s ease-in-out infinite}
.dwl-warm{opacity:0;animation:dwl-lit 7s ease-in-out infinite}
.dwl-burn{transform-box:fill-box;transform-origin:50% 100%;transform:scale(0);animation:dwl-burn 7s ease-in-out infinite}
.dwl-fl{transform-box:fill-box;transform-origin:50% 100%;animation:dwl-flick .7s ease-in-out infinite alternate}
.dwl-smoke{opacity:0;animation:dwl-smoke 7s ease-out infinite}
.dwl-d.b .dwl-halo,.dwl-d.b .dwl-warm,.dwl-d.b .dwl-burn,.dwl-d.b .dwl-smoke{animation-delay:-3.5s}
.dwl-tx{text-align:center;min-width:0}
.dwl-tx small{display:block;color:#ffd978;font-size:clamp(9px,2.4vw,12px);font-weight:600;letter-spacing:.26em;text-transform:uppercase}
.dwl-tx h2{margin:1px 0 0;font-family:var(--f-head);font-weight:800;font-size:clamp(18px,5.3vw,38px);line-height:1.15;white-space:nowrap;padding:0 2px;background:linear-gradient(100deg,#ffd978 20%,#fff 45%,#ffb300 55%,#ffd978 80%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#ffd978;animation:dwl-shine 3.6s linear infinite}
.dwl-tx p{margin:3px auto 8px;max-width:460px;color:#f7e6b8;font-size:clamp(10px,2.7vw,14px);line-height:1.4}
.dwl-tx button{border:0;cursor:pointer;font-family:inherit;font-weight:700;font-size:clamp(12px,3.2vw,14px);color:#4a0c0c;padding:6px 20px;border-radius:999px;background:linear-gradient(#ffe08a,#e9a912);box-shadow:0 2px 0 #a8730b;animation:dwl-pulse 2s ease-out infinite}
.dwl-tx button:active{transform:translateY(2px);box-shadow:0 0 0 #a8730b}
@keyframes dwl-bulb{0%,38%{opacity:1;filter:brightness(1.3) saturate(1.2);box-shadow:0 0 6px 2px var(--c),0 0 16px 5px var(--c)}50%,88%{opacity:.9;filter:brightness(.22) saturate(.7);box-shadow:0 0 0 0 transparent}100%{opacity:1;filter:brightness(1.3) saturate(1.2);box-shadow:0 0 6px 2px var(--c),0 0 16px 5px var(--c)}}
@keyframes dwl-flare{0%,100%{opacity:.15;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}
@keyframes dwl-tw{0%,100%{opacity:0;transform:scale(.3) rotate(0)}50%{opacity:1;transform:scale(1.15) rotate(45deg)}}
@keyframes dwl-sway{0%,100%{transform:rotateY(-16deg) rotateX(10deg)}50%{transform:rotateY(16deg) rotateX(6deg) translateY(-3px)}}
@keyframes dwl-burn{0%,4%{transform:scale(0)}10%{transform:scale(.55)}15%{transform:scale(1.12)}19%,84%{transform:scale(1)}90%{transform:scale(.45)}94%,100%{transform:scale(0)}}
@keyframes dwl-lit{0%,5%{opacity:0}16%,84%{opacity:1}93%,100%{opacity:0}}
@keyframes dwl-flick{0%{transform:scale(1,1) rotate(-3deg) skewX(2deg)}35%{transform:scale(.94,1.08) rotate(2deg) skewX(-3deg)}70%{transform:scale(1.04,.95) rotate(-2deg) skewX(3deg)}100%{transform:scale(.92,1.12) rotate(3deg) skewX(-2deg)}}
@keyframes dwl-smoke{0%,89%{opacity:0;transform:translateY(0)}93%{opacity:.7;transform:translateY(-3px)}100%{opacity:0;transform:translateY(-16px)}}
@keyframes dwl-shine{0%{background-position:120% 0}100%{background-position:-120% 0}}
@keyframes dwl-pulse{0%{box-shadow:0 2px 0 #a8730b,0 0 0 0 #ffd978aa}70%,100%{box-shadow:0 2px 0 #a8730b,0 0 0 12px #ffd97800}}
@media(prefers-reduced-motion:reduce){.dwl *{animation:none!important}.dwl-burn{transform:scale(1)}.dwl-halo,.dwl-warm{opacity:1}.dwl-sp{opacity:.7}}
`;

function DiwaliDiya({ cls }) {
  return (
    <div className="dwl-pr">
      <svg className={'dwl-d ' + cls} viewBox="0 0 80 74" aria-hidden="true">
<defs>
<linearGradient id={`dcl-${cls}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e8924a"/><stop offset=".38" stopColor="#c4601f"/><stop offset=".75" stopColor="#8a3a12"/><stop offset="1" stopColor="#4e1e08"/></linearGradient>
<linearGradient id={`dvt-${cls}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stop-opacity=".22"/><stop offset=".45" stopColor="#fff" stop-opacity="0"/><stop offset="1" stopColor="#000" stop-opacity=".45"/></linearGradient>
<linearGradient id={`drm-${cls}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f7b36a"/><stop offset=".5" stopColor="#d97a30"/><stop offset="1" stopColor="#7a3010"/></linearGradient>
<radialGradient id={`doil-${cls}`} cx=".5" cy=".4" r=".6"><stop offset="0" stopColor="#ffb347"/><stop offset=".5" stopColor="#8a3b0c"/><stop offset="1" stopColor="#2a0d03"/></radialGradient>
<radialGradient id={`dwm-${cls}`} cx=".5" cy=".12" r=".8"><stop offset="0" stopColor="#ffc861" stop-opacity=".95"/><stop offset=".55" stopColor="#ff8a1f" stop-opacity=".35"/><stop offset="1" stopColor="#ff8a1f" stop-opacity="0"/></radialGradient>
<radialGradient id={`dhl-${cls}`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffe08a" stop-opacity=".9"/><stop offset=".4" stopColor="#ffa726" stop-opacity=".4"/><stop offset="1" stopColor="#ff9800" stop-opacity="0"/></radialGradient>
<linearGradient id={`dfl-${cls}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#3d7bff" stop-opacity=".9"/><stop offset=".18" stopColor="#ff7a00"/><stop offset=".6" stopColor="#ffb300"/><stop offset="1" stopColor="#fff3a0"/></linearGradient>
<linearGradient id={`dco-${cls}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#fff7b0"/></linearGradient>
</defs>
<ellipse className="dwl-halo" cx="40" cy="26" rx="46" ry="40" fill={`url(#dhl-${cls})`}/>
<path d="M7 40H73C73 57 59 68 40 68S7 57 7 40Z" fill={`url(#dcl-${cls})`}/>
<path d="M7 40H73C73 57 59 68 40 68S7 57 7 40Z" fill={`url(#dvt-${cls})`}/>
<path className="dwl-warm" d="M7 40H73C73 57 59 68 40 68S7 57 7 40Z" fill={`url(#dwm-${cls})`}/>
<ellipse cx="40" cy="40" rx="33" ry="7" fill={`url(#drm-${cls})`}/>
<ellipse cx="40" cy="41" rx="27" ry="4.8" fill={`url(#doil-${cls})`}/>
<ellipse className="dwl-warm" cx="40" cy="41" rx="27" ry="4.8" fill="#ffb74d" opacity=".5"/>
<path d="M17 52C24 62 56 62 63 52" stroke="#ffd978" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".75"/>
<path d="M14 46C19 57 28 63 40 64" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".16"/>
<rect x="39" y="35" width="2" height="6" rx="1" fill="#2b1608"/>
<path className="dwl-smoke" d="M40 33C37 28 43 25 40 20S42 12 40 8" stroke="#e8e0d8" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
<g className="dwl-burn"><g className="dwl-fl">
<path d="M40 4C46 12 51 19 51 26A11 11 0 0 1 29 26C29 19 34 12 40 4Z" fill={`url(#dfl-${cls})`}/>
<path d="M40 15C43.5 20 45.5 24 45.5 27.5A5.5 5.5 0 0 1 34.5 27.5C34.5 24 36.5 20 40 15Z" fill={`url(#dco-${cls})`}/>
</g></g>
</svg>
    </div>
  );
}

function DiwaliBanner() {
  if (!DIWALI.show) return null;
  if (DIWALI.until && new Date() > new Date(DIWALI.until + 'T23:59:59')) return null;
  const goShop = () => {
    const el = document.querySelector('.shop');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <section className="dwl" aria-label="Diwali offer">
      <style>{DW_CSS}</style>
      <span className="dwl-cf l" aria-hidden="true" />
      <span className="dwl-cf r" aria-hidden="true" />
      <ul className="dwl-lt" aria-hidden="true">
        {Array.from({ length: 16 }).map((_, i) => (
          <li key={i}><i style={{ '--c': DW_COLORS[i % DW_COLORS.length], '--d': (i % 4) * 0.35 + 's' }} /></li>
        ))}
      </ul>
      {DW_SPARKS.map((a, i) => (
        <span key={i} className="dwl-sp" aria-hidden="true" style={{ left: a[0] + '%', top: a[1] + '%', animationDelay: a[2] + 's' }} />
      ))}
      <div className="dwl-in">
        <DiwaliDiya cls="a" />
        <div className="dwl-tx">
          <small>{DIWALI.label}</small>
          <h2>{DIWALI.title}</h2>
          <p>{DIWALI.text}</p>
          <button type="button" onClick={goShop}>{DIWALI.cta}</button>
        </div>
        <DiwaliDiya cls="b" />
      </div>
    </section>
  );
}

/* ===== SiteShell ===== */
function SiteShell({ children }) {
  const { loaded, loadErr } = useCat();
  const pathname = usePathname();
  const { hideToast } = useStore();

  // toast never follows you to another page
  useEffect(() => { hideToast(); }, [pathname, hideToast]);

  if (!loaded) return <div className="ldg"><span /></div>;
  return (
    <>
      {loadErr ? <div className="lderr">Store data could not be loaded: {loadErr}. Check the .env file and the SQL setup.</div> : null}
      <Marquee />
      {pathname === '/' ? <DiwaliBanner /> : null}
      {pathname === null ? null : pathname === '/' ? <Hero /> : <MiniHeader />}
      <main id="app">{children}</main>
      <Footer />
      <BottomNav />
      <Toast />
    </>
  );
}

/* ===== SheetPicker ===== */
/* Bottom sheet used for "Sort by" and "Filter by tag" */
function SheetPicker({ open, title, options, current, onPick, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div className={'shw' + (open ? ' on' : '')}>
      <div className="shb" onClick={onClose} />
      <div className="shs" role="dialog" aria-label={title} aria-hidden={!open}>
        <div className="shh">
          <b>{title}</b>
          <button onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        {options.map((x) => (
          <button
            key={x.v || 'none'}
            className={'op' + (x.v === current ? ' on' : '')}
            onClick={() => onPick(x.v)}
            tabIndex={open ? 0 : -1}
          >
            <i>{x.icon}</i>
            <span>{x.label}</span>
            <u>{x.v === current ? <Icon name="check" size={14} /> : null}</u>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===== ProductCard ===== */
function ProductCard({ p }) {
  const router = useRouter();
  const { cart, bumpBase, showToast } = useStore();
  const q = (cart.find((c) => c.id == p.id && c.k == 0) || {}).q;
  const k0 = p.pk[0];

  const add = (e) => {
    e.stopPropagation();
    bumpBase(p.id, 1);
    showToast(`${p.n} (${k0.l}) added to cart`);
  };
  const chg = (d, e) => {
    e.stopPropagation();
    bumpBase(p.id, d);
  };

  return (
    <div className="card" onClick={() => router.push(`/product/${p.id}`)}>
      {p.t ? <span className="tag" data-t={p.t} style={{ '--tc': p.tc }}>{p.t}</span> : null}
      <div className="im">
        <img src={pimg(p, 0)} alt={p.n} loading="lazy" />
      </div>
      <h3>
        <Link href={`/product/${p.id}`} onClick={(e) => e.stopPropagation()}>{p.n}</Link>
      </h3>
      <div className="cpr">
        {rs(k0.p)}{k0.m > k0.p ? <s>{rs(k0.m)}</s> : null}
        <small>{k0.l}</small>
      </div>
      {!p.stock ? (
        <button className="btn g ab" disabled>Out of stock</button>
      ) : q ? (
        <div className="cq" onClick={(e) => e.stopPropagation()}>
          <button onClick={(e) => chg(-1, e)} aria-label="Decrease quantity">−</button>
          <span>{q} in cart</span>
          <button onClick={(e) => chg(1, e)} aria-label="Increase quantity">+</button>
        </div>
      ) : (
        <button className="btn g ab" onClick={add}>
          <Icon name="cart" size={16} />Add to Cart
        </button>
      )}
    </div>
  );
}

/* ===== HomeView ===== */
const STRIP_ICONS = ['truck', 'cash', 'leaf', 'shield', 'star', 'tag', 'box', 'bolt'];

const SORTS = [
  { v: '', label: 'Featured', icon: <Icon name="star" size={18} /> },
  { v: 'l', label: 'Price: Low to High', icon: <Icon name="up" size={18} /> },
  { v: 'h', label: 'Price: High to Low', icon: <Icon name="down" size={18} /> },
  { v: 'r', label: 'Top Rated', icon: <Icon name="star" size={18} /> },
];


function HomeView() {
  const { S, P, CATOBJ } = useCat();
  const { filters, setFilters } = useStore();
  const { q, c, s, t } = filters;
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const TAGS = useMemo(
    () => [
      { v: '', label: 'All Tags', icon: <Icon name="tag" size={18} /> },
      ...[...new Map(P.filter((p) => p.t).map((p) => [p.t, p.tc])).entries()].map(([x, col]) => ({
        v: x,
        label: x,
        icon: <s style={{ background: col }} />,
      })),
    ],
    [P]
  );
  const [sheet, setSheet] = useState(null); // 's' | 't' | null
  const [lastSheet, setLastSheet] = useState('s'); // keeps content while closing
  const open = (k) => { setLastSheet(k); setSheet(k); };
  const close = () => setSheet(null);

  const list = useMemo(() => {
    const a = P.filter(
      (p) =>
        (c === 'All' || p.c === c) &&
        (!t || p.t === t) &&
        (p.n + p.c + p.g + p.cap).toLowerCase().includes(q.toLowerCase().trim())
    );
    if (s === 'l') a.sort((x, y) => x.pk[0].p - y.pk[0].p);
    if (s === 'h') a.sort((x, y) => y.pk[0].p - x.pk[0].p);
    if (s === 'r') a.sort((x, y) => y.r - x.r);
    return a;
  }, [P, q, c, s, t]);

  const sortLabel = SORTS.find((x) => x.v === s)?.label;
  const curCat = CATOBJ.find((x) => x.name === c);
  const hasFilter = q || s || t || c !== 'All';

  return (
    <div className="wrap">
      <div className="top">
        <div className="srch">
          <Icon name="search" />
          <input
            id="q"
            type="search"
            placeholder="Search masale, spices, blends..."
            aria-label="Search products"
            value={q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>
        <div className="flt">
          <button className={'dd' + (s ? ' act' : '')} onClick={() => open('s')} aria-haspopup="dialog">
            <Icon name="sort" size={18} />
            <span>{s ? sortLabel : 'Sort by'}</span>
            <Icon name="chev" size={16} />
          </button>
          <button className={'dd' + (t ? ' act' : '')} onClick={() => open('t')} aria-haspopup="dialog">
            <Icon name="tag" size={18} />
            <span>{t || 'All Tags'}</span>
            <Icon name="chev" size={16} />
          </button>
          <button
            className="clr"
            style={{ display: hasFilter ? '' : 'none' }}
            onClick={() => setFilters({ q: '', c: 'All', s: '', t: '' })}
          >
            <Icon name="x" size={14} />Clear
          </button>
        </div>
      </div>

      <div className="strip">
        {(S.strip_items || []).map((t, i) => (
          <div key={i}><Icon name={STRIP_ICONS[i % STRIP_ICONS.length]} size={18} />{t}</div>
        ))}
      </div>

      {curCat && curCat.banner_url ? (
        <div className="cbn"><img src={curCat.banner_url} alt={curCat.name} /></div>
      ) : null}

      <div className="hd">
        <h2>{c === 'All' ? 'All Products' : c}</h2>
        <span>{list.length} items</span>
      </div>

      <div className="shop">
        <aside className="cats" aria-label="Categories">
          {CATOBJ.map((x) => (
            <button
              key={x.name}
              className={x.name === c ? 'on' : ''}
              onClick={() => set({ c: x.name })}
              aria-label={x.name}
            >
              <img src={cimg(x)} alt="" />
              <span>{x.name}</span>
            </button>
          ))}
        </aside>
        <div className="grid">
          {list.length ? (
            list.map((p) => <ProductCard key={p.id} p={p} />)
          ) : (
            <div className="empty" style={{ gridColumn: '1/-1' }}>
              <Icon name="search" size={40} />
              <p>{P.length ? 'No products found. Try a different name or clear the filters.' : 'Products are coming soon. Please visit again.'}</p>
            </div>
          )}
        </div>
      </div>

      <ProcessSection />

      <WhySection />

      <SheetPicker
        open={!!sheet}
        title={lastSheet === 's' ? 'Sort by' : 'Filter by tag'}
        options={lastSheet === 's' ? SORTS : TAGS}
        current={lastSheet === 's' ? s : t}
        onPick={(v) => { set(lastSheet === 's' ? { s: v } : { t: v }); close(); }}
        onClose={close}
      />
    </div>
  );
}

/* ===== SuggestCard ===== */
/* Small product card with Add / qty stepper (100 g pack) */
function SuggestCard({ p, quiet = false }) {
  const { cart, bumpBase, showToast } = useStore();
  const x = cart.find((c) => c.id == p.id && c.k == 0);
  const step = (d) => {
    bumpBase(p.id, d);
    if (d > 0 && !quiet) showToast(`${p.n} (${p.pk[0].l}) added to cart`);
  };
  return (
    <div className="sc">
      <Link href={`/product/${p.id}`} aria-label={`View ${p.n}`}>
        <img src={pimg(p, 0)} alt={p.n} loading="lazy" />
        <div className="sb">
          <b>{p.n}</b>
          <small>{p.pk[0].l}</small>
          <div className="sp">{rs(p.pk[0].p)}{p.pk[0].m > p.pk[0].p ? <s>{rs(p.pk[0].m)}</s> : null}</div>
        </div>
      </Link>
      <div className="sctl">
        {x ? (
          <div className="cq">
            <button onClick={() => step(-1)} aria-label="Decrease quantity">−</button>
            <span>{x.q}</span>
            <button onClick={() => step(1)} aria-label="Increase quantity">+</button>
          </div>
        ) : (
          <button className="btn g" disabled={!p.stock} onClick={() => step(1)}>
            <Icon name="cart" size={15} />{p.stock ? 'Add' : 'Sold out'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ===== ProductDetail ===== */
function ProductDetail({ id }) {
  const { S, BN, WA, ADDR, FREE_SHIP, P } = useCat();
  const p = P.find((x) => x.id == id);
  const router = useRouter();
  const { addLine, showToast, setFilters } = useStore();
  const [sel, setSel] = useState(0);
  const [qty, setQty] = useState(1);
  const [gi, setGi] = useState(0);
  const [rvs, setRvs] = useState([]);
  const pid = p ? p.id : null;

  useEffect(() => {
    if (!pid || !configured) return;
    let off = false;
    supabase
      .from('reviews')
      .select('id,name,rating,message,order_id,created_at')
      .eq('product_id', pid)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (!off && data) setRvs(data); });
    return () => { off = true; };
  }, [pid]);

  if (!p) return null;

  const si = p.pk[sel] ? sel : 0;
  const k = p.pk[si];
  const save = k.m - k.p;
  const info = packInfo(k.l);
  const per = (x) => x.p / packInfo(x.l).q;
  const comparable = p.pk.length > 1 && p.pk.every((x) => packInfo(x.l).q > 0);
  const best = comparable ? p.pk.reduce((m, x, i) => (per(x) < per(p.pk[m]) ? i : m), 0) : -1;
  const ar = p.rc ? p.r.toFixed(1) : '0.0';
  const imgs = p.imgs.length ? p.imgs : [pimg(p, 0)];
  const cur = imgs[Math.min(gi, imgs.length - 1)];
  const rel = P.filter((x) => x.id != p.id)
    .sort((a, b) => Number(b.c == p.c) - Number(a.c == p.c))
    .slice(0, 6);
  const wa = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hi, I would like to know more about ' + p.n);
  const trust = [
    ['truck', 'Free delivery', `On orders above ${rs(FREE_SHIP)}`],
    ['cash', 'Cash on Delivery', 'Pay when it arrives'],
    ['shield', 'Quality checked', 'Packed with care'],
    ['leaf', 'Pure & natural', 'Carefully selected'],
  ];

  const add = (buy) => {
    if (!p.stock) return;
    addLine(p.id, si, qty);
    if (buy) return router.push('/cart');
    showToast(`${p.n} (${k.l}) added`, 4000);
  };
  const share = () => {
    const u = location.href;
    const t = p.n + ' | ' + BN;
    if (navigator.share) navigator.share({ title: t, url: u }).catch(() => {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(t + ' ' + u), '_blank');
  };

  return (
    <div className="wrap pd">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <Icon name="next" size={14} />
        <Link href="/" onClick={() => setFilters((f) => ({ ...f, c: p.c }))}>{p.c}</Link>
        <Icon name="next" size={14} />
        <span aria-current="page">{p.n}</span>
      </nav>

      <div className="pd-top">
        <div className="pd-g">
          <div className="pd-m">
            {p.t ? <span className="tag" data-t={p.t} style={{ '--tc': p.tc }}>{p.t}</span> : null}
            <img id="mi" src={cur} alt={p.n} />
          </div>
          {imgs.length > 1 ? (
            <div className="pd-ts">
              {imgs.map((u, i) => (
                <button key={u + i} className={'pd-t' + (u === cur ? ' on' : '')} onClick={() => setGi(i)} aria-label={`View photo ${i + 1}`}>
                  <img src={u} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pd-i">
          <span className="bdg" style={{ background: '#eef8ee', color: 'var(--gr)' }}>{p.c}</span>
          <h1 className="pd-h">{p.n}</h1>
          {p.cap ? <p className="pd-cp">{p.cap}</p> : null}
          <div className="pd-rt">
            <Stars r={ar} />
            <b>{ar}</b>
            <button onClick={() => document.getElementById('rv').scrollIntoView({ behavior: 'smooth' })}>
              {p.rc ? `${p.rc} review${p.rc > 1 ? 's' : ''}` : 'No reviews yet'}
            </button>
          </div>

          <div className="box">
            <div className="pd-pc">
              <div className="pd-pr">{rs(k.p)}{save > 0 ? <s>{rs(k.m)}</s> : null}</div>
              {save > 0 ? <Countdown /> : null}
            </div>
            {save > 0 ? (
              <div className="pd-sv">
                <b>{Math.round((save / k.m) * 100)}% OFF</b>
                <span>
                  You save {rs(save)}
                  {info.q ? ` · ${rs(Math.round((k.p / info.q) * 100))} per 100 ${info.u}` : ''}
                </span>
              </div>
            ) : null}
            {!p.stock ? <div className="pd-sv" style={{ background: '#fdecea', color: '#b71c1c' }}><b>Out of stock</b><span>This product is currently unavailable</span></div> : null}
            <span className="pd-lb" id="pkl">Select pack size</span>
            <div className="pd-pk" role="radiogroup" aria-labelledby="pkl">
              {p.pk.map((x, i) => (
                <button
                  key={x.l + i}
                  role="radio"
                  aria-checked={i === si}
                  className={i === si ? 'on' : ''}
                  onClick={() => { setSel(i); setQty(1); }}
                >
                  <b>{x.l}</b>
                  <small>{rs(x.p)}</small>
                  {i === best ? <em>Best value</em> : null}
                </button>
              ))}
            </div>
            <div className="pd-q">
              <div>
                <span className="pd-lb" style={{ margin: '0 0 6px' }}>Quantity</span>
                <div className="qty">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div className="tt">Total<b>{rs(k.p * qty)}</b></div>
            </div>
            <div className="pd-cta">
              <button className="btn o" disabled={!p.stock} onClick={() => add(false)}><Icon name="cart" size={18} />Add to Cart</button>
              <button className="btn g" disabled={!p.stock} onClick={() => add(true)}><Icon name="bolt" size={18} />Buy Now</button>
            </div>
          </div>

          <div className="pd-tr">
            {trust.map((a) => (
              <div key={a[1]}>
                <i><Icon name={a[0]} size={20} /></i>
                <span><strong>{a[1]}</strong>{a[2]}</span>
              </div>
            ))}
          </div>

          <div className="pd-ac">
            {WA ? (
              <a className="btn o sm" href={wa} target="_blank" rel="noopener">
                <WaIcon size={18} color="currentColor" />Ask on WhatsApp
              </a>
            ) : null}
            <button className="btn o sm" onClick={share}><Icon name="share" size={16} />Share</button>
          </div>
        </div>
      </div>

      <div className="pd-sec">
        <div className="box" style={{ margin: 0 }}>
          <h3><Icon name="file" size={18} />About this product</h3>
          <p>{p.d || p.cap || p.n}</p>
          {p.g ? (
            <>
              <h3 style={{ marginTop: 14 }}><Icon name="leaf" size={18} />Ingredients</h3>
              <div className="chips">
                {p.g.split(',').map((x, i) => <span key={x + i}>{x.trim()}</span>)}
              </div>
            </>
          ) : null}
        </div>
        <div className="box" style={{ margin: 0 }}>
          <h3><Icon name="box" size={18} />Product details</h3>
          <dl className="pd-dl">
            <dt>Category</dt><dd>{p.c}</dd>
            <dt>Pack sizes</dt><dd>{p.pk.map((x) => x.l).join(', ')}</dd>
            <dt>Brand</dt><dd>{BN}</dd>
            {ADDR ? <><dt>Made in</dt><dd>{ADDR}</dd></> : null}
            <dt>Payment</dt><dd>Cash on Delivery</dd>
            {S.delivery_days ? <><dt>Delivery</dt><dd>{S.delivery_days} (estimated)</dd></> : null}
          </dl>
        </div>
      </div>

      <div className="box" id="rv" style={{ marginTop: 12 }}>
        <h3><Icon name="star" size={18} />Reviews &amp; Ratings</h3>
        <div className="pd-rs">
          <div className="pd-big">{ar}</div>
          <div>
            <Stars r={ar} size={18} />
            <small>{p.rc ? `Based on ${p.rc} rating${p.rc > 1 ? 's' : ''}` : 'Be the first to review after delivery'}</small>
          </div>
        </div>
        {rvs.map((r) => (
          <div className="pd-rv" key={r.id}>
            <div className="pd-av" aria-hidden="true">{((r.name || 'C')[0] || 'C').toUpperCase()}</div>
            <div>
              <b>{r.name}</b> <Stars r={r.rating} size={13} />
              {r.order_id ? <>{' '}<small style={{ color: 'var(--gr)' }}>Verified purchase</small></> : null}
              {r.message ? <p>{r.message}</p> : null}
            </div>
          </div>
        ))}
      </div>

      {rel.length ? (
        <section aria-label="Related products">
          <div className="hd">
            <h2>You may also like</h2>
            <span>Similar to {p.n}</span>
          </div>
          <div className="sug">
            {rel.map((x) => <SuggestCard key={x.id} p={x} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* ===== CartView ===== */
function CartView() {
  const { FREE_SHIP, env } = useCat();
  const { ready, cart, count: n, changeQty } = useStore();
  const router = useRouter();
  if (!ready) return <div className="wrap pg pg2" style={{ minHeight: '60vh' }} />;

  const b = computeBill(cart, '', env);
  const need = FREE_SHIP - b.pay;

  return (
    <div className="wrap pg pg2">
      <Steps n={0} />
      <PageHead
        icon="cart"
        title="Your Cart"
        sub={n ? `${n} item${n > 1 ? 's' : ''} · Review before checkout` : 'Review your items before checkout'}
      />
      {b.L.length ? (
        <>
          <div className={'box fdb' + (need > 0 ? '' : ' ok')}>
            <i><Icon name={need > 0 ? 'truck' : 'check'} size={22} /></i>
            <div>
              {need > 0 ? (
                <>Add <b>{rs(need)}</b> more to get <b>free delivery</b></>
              ) : (
                <><b>Free delivery</b> unlocked on this order</>
              )}
              <div className="fd"><i style={{ width: Math.min(100, (b.pay / FREE_SHIP) * 100) + '%' }} /></div>
            </div>
          </div>

          <div className="box">
            <h3><Icon name="bag" size={18} />Items in your cart</h3>
            {b.L.map((l, i) => (
              <div className="cl" key={l.id + '-' + l.k.l}>
                <img src={pimg(l.p, 0)} alt={l.p.n} />
                <div className="cb">
                  <b>{l.p.n}</b>
                  <small>{l.k.l} · {rs(l.k.p)} each</small>
                  <div className="cr">
                    <div className="qty">
                      <button onClick={() => changeQty(i, -1)} aria-label={`Decrease quantity of ${l.p.n}`}>−</button>
                      <span>{l.q}</span>
                      <button onClick={() => changeQty(i, 1)} aria-label={`Increase quantity of ${l.p.n}`}>+</button>
                    </div>
                    <button className="rm" onClick={() => changeQty(i, -99)}>
                      <Icon name="trash" size={14} />Remove
                    </button>
                  </div>
                </div>
                <div className="ct">
                  <b>{rs(l.tot)}</b>
                  {l.mrp > l.tot ? <s>{rs(l.mrp)}</s> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="box bill">
            <h3><Icon name="file" size={18} />Price details</h3>
            <div><span>Subtotal ({n} item{n > 1 ? 's' : ''})</span><span>{rs(b.sub)}</span></div>
            {b.disc > 0 ? <div style={{ color: 'var(--gr)' }}><span>Discount</span><span>− {rs(b.disc)}</span></div> : null}
            <div><span>Delivery</span><span>{b.ship ? rs(b.ship) : 'FREE'}</span></div>
            <div className="t"><span>Total</span><span>{rs(b.total)}</span></div>
          </div>

          {b.disc ? (
            <div className="sv-b"><Icon name="tag" size={18} />You are saving {rs(b.disc)} on this order</div>
          ) : null}

          <button className="btn w" onClick={() => router.push('/address')}>
            Proceed to Address <Icon name="arrow" size={18} />
          </button>
          <Link className="btn o w" style={{ marginTop: 10 }} href="/">Continue shopping</Link>
        </>
      ) : (
        <Empty icon="cart" title="Your cart is empty" text="Add your favourite masale to get started." shop />
      )}
    </div>
  );
}

/* ===== AddressView ===== */
function Field({ name, label, type = 'text', placeholder = '', required = true, value }) {
  return (
    <label>
      {label}
      <input name={name} type={type} defaultValue={value || ''} placeholder={placeholder} required={required} />
    </label>
  );
}

function AddressView() {
  const { ready, cart, addr, setAddr } = useStore();
  const router = useRouter();
  const [err, setErr] = useState('');

  useEffect(() => {
    if (ready && !cart.length) router.replace('/cart');
  }, [ready, cart.length, router]);

  if (!ready || !cart.length) return <div className="wrap pg" style={{ minHeight: '60vh' }} />;

  const submit = (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (!/^\d{10}$/.test(f.phone.trim())) return setErr('Enter a valid 10-digit mobile number.');
    if (!/^\d{6}$/.test(f.pin.trim())) return setErr('Enter a valid 6-digit pincode.');
    setAddr(f);
    router.push('/payment');
  };

  return (
    <div className="wrap pg" style={{ maxWidth: 660 }}>
      <Steps n={1} />
      <Link href="/cart" className="back"><Icon name="back" size={18} />Back to cart</Link>
      <PageHead icon="pin" title="Delivery Address" sub="Where should we deliver your order?" />
      <form className="box" onSubmit={submit}>
        <Field name="name" label="Full name" value={addr.name} />
        <Field name="phone" label="Mobile number" type="tel" placeholder="10-digit mobile number" value={addr.phone} />
        <Field name="pin" label="Pincode" placeholder="6-digit pincode" value={addr.pin} />
        <Field name="city" label="City" value={addr.city} />
        <Field name="state" label="State" value={addr.state} />
        <label>
          Full address
          <textarea name="line" rows={3} placeholder="House no., street, area" required defaultValue={addr.line || ''} />
        </label>
        <Field name="lm" label="Landmark (optional)" required={false} value={addr.lm} />
        <p id="er" style={{ color: 'var(--rd)', fontSize: 14, marginTop: 8 }} role="alert">{err}</p>
        <br />
        <button className="btn w">Continue to Payment <Icon name="arrow" size={18} /></button>
      </form>
    </div>
  );
}

/* ===== CouponBox ===== */
function Confetti() {
  return (
    <span className="cf" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <u
          key={i}
          style={{
            '--x': Math.round(Math.cos(i * 0.39) * 80) + 'px',
            '--y': Math.round(Math.sin(i * 0.39) * 55 - 10) + 'px',
            '--c': ['#d9a21b', '#2e7d32', '#d32f2f', '#5a1010'][i % 4],
            animationDelay: i * 12 + 'ms',
          }}
        />
      ))}
    </span>
  );
}

/* b = bill (with the currently applied coupon, if any) */
function CouponBox({ b }) {
  const { CP } = useCat();
  const { setCoupon, ensureCoupon } = useStore();
  const [list, setList] = useState(false);
  const [msg, setMsg] = useState('');
  const [val, setVal] = useState('');
  const [fresh, setFresh] = useState('');
  const [btn, setBtn] = useState({ src: null, s: null }); // loading / done animation on Apply buttons

  const apply = async (code, src) => {
    code = (code || '').trim().toUpperCase();
    setVal(code);
    if (!code) return setMsg('Please enter a coupon code.');
    const cp = CP.find((x) => x.c === code) || (await ensureCoupon(code));
    if (!cp) return setMsg('Invalid coupon code. Please check and try again.');
    const k = chk(cp, { ...b, cd: 0 });
    if (!k.ok) return setMsg('Not applicable: ' + k.m + '.');

    const fin = () => {
      setCoupon(code);
      setFresh(code);
      setMsg('');
      setVal('');
      setBtn({ src: null, s: null });
      setTimeout(() => setFresh(''), 900);
    };
    setBtn({ src, s: 'ld' });
    setTimeout(() => {
      setBtn({ src, s: 'dn' });
      setTimeout(fin, 450);
    }, 600);
  };

  const label = (src, text) =>
    btn.src === src && btn.s === 'dn' ? <Icon name="check" size={18} /> : btn.src === src && btn.s === 'ld' ? '' : text;
  const cls = (src) => 'btn g' + (btn.src === src ? (btn.s === 'ld' ? ' ld' : ' dn') : '');

  return (
    <div className="box" id="cpb">
      <h3><Icon name="tag" size={18} />Coupons &amp; Offers</h3>

      {b.cc ? (
        <div className={'cpok' + (fresh === b.cc ? ' pop' : '')}>
          {fresh === b.cc ? <Confetti /> : null}
          <i><Icon name="check" size={20} /></i>
          <div>
            <b>{b.cc} applied</b><br />
            <small>You saved {rs(b.cd)} with this coupon</small>
          </div>
          <button className="rm" onClick={() => { setCoupon(''); setMsg(''); }}>
            <Icon name="x" size={14} />Remove
          </button>
        </div>
      ) : (
        <>
          <form
            className="cpf"
            onSubmit={(e) => { e.preventDefault(); apply(val, 'form'); }}
          >
            <input
              name="c"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Enter coupon code"
              autoCapitalize="characters"
              autoComplete="off"
              aria-label="Coupon code"
            />
            <button className={cls('form')}>{label('form', 'Apply')}</button>
          </form>
          <p className="cpm" role="alert">{msg}</p>
        </>
      )}

      <button className="btn o w" style={{ marginTop: 10 }} onClick={() => setList((o) => !o)} aria-expanded={list}>
        <Icon name="tag" size={18} />{list ? 'Hide' : 'View'} available coupons
      </button>

      {list ? (
        <div className="cpl">
          {CP.filter((x) => x.pub).map((x) => {
            const k = chk(x, { ...b, cd: 0 });
            const ap = b.cc === x.c;
            return (
              <div key={x.c} className={'cpn' + (k.ok ? '' : ' nope')}>
                <div className="cpl1">
                  <b>{x.c}</b>
                  <span>{x.t}</span>
                  <small>{x.d}</small>
                  {k.ok ? (
                    <em className="sv">You save {rs(k.d)} on this order</em>
                  ) : (
                    <em className="nt">{k.m}</em>
                  )}
                </div>
                {ap ? (
                  <span className="cpa"><Icon name="check" size={16} />Applied</span>
                ) : (
                  <button className={cls(x.c)} disabled={!k.ok} onClick={() => apply(x.c, x.c)}>
                    {label(x.c, 'Apply')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ===== PaymentView ===== */
/* "Before you pay" - 4 popular items not yet in the cart (picked once on mount) */
function SugBox({ pay }) {
  const { FREE_SHIP, P, findProduct } = useCat();
  const { cart } = useStore();
  const [ids] = useState(() => {
    const inC = new Set(cart.map((c) => c.id));
    const w = (p) => (p.t === 'Bestseller' ? 2 : p.t === 'Hot Pick' ? 1 : 0);
    return P.filter((p) => !inC.has(p.id) && p.stock).sort((a, b) => w(b) - w(a)).slice(0, 4).map((p) => p.id);
  });
  if (!ids.length) return null;
  const need = FREE_SHIP - pay;
  return (
    <div className="box">
      <h3><Icon name="bag" size={18} />Before you pay</h3>
      <p style={{ fontSize: 13, color: 'var(--mu)' }}>
        {need > 0 ? `Add ${rs(need)} more to get free delivery` : 'You get free delivery on this order'}
      </p>
      <div className="sug" style={{ marginTop: 10 }}>
        {ids.map((id) => <SuggestCard key={id} p={findProduct(id)} quiet />)}
      </div>
    </div>
  );
}

function PaymentView() {
  const { findCoupon, env } = useCat();
  const { ready, cart, addr, coupon, setCoupon, placeOrder, ensureCoupon } = useStore();
  const router = useRouter();
  const placing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [perr, setPerr] = useState('');
  const [cpChecked, setCpChecked] = useState(false);

  const b = computeBill(cart, coupon, env);

  // a saved hidden coupon is not in the public list - look it up once
  useEffect(() => {
    if (!ready) return;
    if (!coupon || findCoupon(coupon)) { setCpChecked(true); return; }
    let off = false;
    ensureCoupon(coupon).then(() => { if (!off) setCpChecked(true); });
    return () => { off = true; };
  }, [ready, coupon]); // eslint-disable-line react-hooks/exhaustive-deps

  // drop a saved coupon that is no longer valid for this cart
  useEffect(() => {
    if (ready && cpChecked && coupon && b.badCoupon) setCoupon('');
  }, [ready, cpChecked, coupon, b.badCoupon, setCoupon]);

  // guard: need items + address (but not while we are placing the order)
  useEffect(() => {
    if (ready && !placing.current && (!cart.length || !addr.name)) router.replace('/cart');
  }, [ready, cart.length, addr.name, router]);

  if (!ready || !cart.length || !addr.name) return <div className="wrap pg" style={{ minHeight: '60vh' }} />;

  const place = async () => {
    if (busy) return;
    setBusy(true);
    setPerr('');
    placing.current = true;
    try {
      const id = await placeOrder();
      router.push('/order-success/' + id);
    } catch (e) {
      placing.current = false;
      setBusy(false);
      setPerr((e && e.message) || 'Could not place the order. Please try again.');
    }
  };

  return (
    <div className="wrap pg" style={{ maxWidth: 660 }}>
      <Steps n={2} />
      <Link href="/address" className="back"><Icon name="back" size={18} />Back to address</Link>
      <PageHead icon="bag" title="Bill & Payment" sub="Review your bill and place the order" />

      <CouponBox b={b} />
      <SugBox pay={b.pay} />

      <div className="box bill">
        <h3><Icon name="bag" size={18} />Bill Details</h3>
        {b.L.map((l) => (
          <div key={l.id + '-' + l.k.l}>
            <span>{l.p.n} ({l.k.l}) × {l.q}</span>
            <span>{rs(l.mrp)}</span>
          </div>
        ))}
        {b.disc > 0 ? <div style={{ color: 'var(--gr)' }}><span>Discount</span><span>− {rs(b.disc)}</span></div> : null}
        {b.cc ? (
          <div style={{ color: 'var(--gr)' }}><span>Coupon ({b.cc})</span><span>− {rs(b.cd)}</span></div>
        ) : null}
        <div><span>Delivery</span><span>{b.ship ? rs(b.ship) : 'FREE'}</span></div>
        <div className="t"><span>Total payable</span><span>{rs(b.total)}</span></div>
      </div>

      <div className="box">
        <h3><Icon name="pin" size={18} />Delivering to</h3>
        <p>
          <b>{addr.name}</b> · {addr.phone}<br />
          {addr.line}{addr.lm ? ', ' + addr.lm : ''}<br />
          {addr.city}, {addr.state} - {addr.pin}<br />
          <Link href="/address">Change address</Link>
        </p>
      </div>

      <div className="box">
        <h3><Icon name="cash" size={18} />Payment Method</h3>
        <label className="cod">
          <input type="radio" defaultChecked readOnly />
          <Icon name="cash" size={22} />Cash on Delivery
          <span style={{ marginLeft: 'auto', fontWeight: 400, fontSize: 12 }}>Pay when it arrives</span>
        </label>
      </div>

      {perr ? <p style={{ color: 'var(--rd)', fontSize: 14, margin: '0 0 10px' }} role="alert">{perr}</p> : null}
      <button className="btn w" onClick={place} disabled={busy}>
        <Icon name="check" size={18} />{busy ? 'Placing order…' : `Place Order · ${rs(b.total)}`}
      </button>
    </div>
  );
}

/* ===== DoneView ===== */
function DoneView({ id }) {
  const { S, BN } = useCat();
  const router = useRouter();
  return (
    <div className="wrap pg ok" style={{ maxWidth: 560 }}>
      <svg className="big" viewBox="0 0 120 120" fill="none" stroke="#2e7d32" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="60" cy="60" r="48" />
        <path className="ck" d="M38 62l15 15 30-32" />
      </svg>
      <h2>Order Placed Successfully!</h2>
      <p>Thank you for shopping with {BN}.</p>
      <div className="oid">{id}</div>
      <p style={{ color: 'var(--mu)' }}>
        Keep this Order ID to track your order.<br />
        Payment: Cash on Delivery{S.delivery_days ? ` · Estimated delivery: ${S.delivery_days}` : ''}
      </p>
      <br />
      <button className="btn w" onClick={() => router.push('/track/' + encodeURIComponent(id))}>
        <Icon name="truck" size={18} />Track Order
      </button>
      <br /><br />
      <button className="btn o w" onClick={() => router.push('/')}>Continue Shopping</button>
    </div>
  );
}

/* ===== OrderBox ===== */
/* "Rate this product" - only for delivered orders (st === 4) */
function RateItem({ o, item }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [seen, setSeen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (o.st !== 4 || !item.pid || !configured) { setSeen(true); return; }
    let off = false;
    supabase
      .from('reviews')
      .select('rating,message')
      .eq('order_id', o.id)
      .eq('product_id', item.pid)
      .maybeSingle()
      .then(({ data }) => { if (!off) { setDone(data || null); setSeen(true); } });
    return () => { off = true; };
  }, [o.id, o.st, item.pid]);

  if (o.st !== 4 || !item.pid || !seen) return null;

  if (done)
    return (
      <div className="rt-done">
        <Stars r={done.rating} size={15} />
        <b>Your review</b>
        {done.message ? <p>{done.message}</p> : null}
      </div>
    );

  if (!open)
    return (
      <div className="rt">
        <button className="btn o sm" onClick={() => setOpen(true)}>
          <Icon name="star" size={16} />Rate this product
        </button>
      </div>
    );

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setErr('Please select a star rating.');
    setBusy(true);
    const { error } = await supabase.rpc('submit_review', {
      p_order: o.id,
      p_pid: item.pid,
      p_name: (o.addr && o.addr.name) || 'Customer',
      p_rating: rating,
      p_msg: msg.trim(),
    });
    setBusy(false);
    if (error) return setErr(error.message);
    setDone({ rating, message: msg.trim() });
  };

  return (
    <div className="rt">
      <form className="rtf" onSubmit={submit}>
        <b>How was this product?</b>
        <div className="rsl" role="radiogroup" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className={n <= rating ? 'f' : ''}
              onClick={() => { setRating(n); setErr(''); }}
            >
              <Icon name="star" size={30} />
            </button>
          ))}
        </div>
        <label>
          Write a review (optional)
          <textarea rows={3} maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)}
                    placeholder="Share your experience with this product" />
        </label>
        <p className="cpm" role="alert">{err}</p>
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="btn o sm" onClick={() => { setOpen(false); setErr(''); }}>Cancel</button>
          <button className="btn g sm" disabled={busy}>{busy ? 'Sending…' : 'Submit review'}</button>
        </div>
      </form>
    </div>
  );
}

function OrderBox({ o, full = false }) {
  return (
    <div className="box">
      <div className="oh">
        <div>
          <b><Icon name="bag" size={18} />{o.id}</b>
          <small>Placed on {fdate(o.date)}</small>
        </div>
        <span className={'bdg' + (o.st === 4 ? ' dl' : '')}>{ST[o.st]}</span>
      </div>
      <div className="oprog">
        <div className="fd"><i style={{ width: ((Math.min(o.st, 4) + 1) / 5) * 100 + '%', background: o.st === 5 ? '#c62828' : undefined }} /></div>
        <small>{SD[o.st]}</small>
      </div>
      <div style={{ marginTop: 6 }}>
        {o.items.map((i) => (
          <div className="oi" key={i.n + i.k}>
            <div className="ci">
              <img src={i.img || pimg({ n: i.n }, 0)} alt={i.n} />
              <div>
                <b>{i.n}</b><br />
                <small>{i.k} × {i.q}</small>
              </div>
              <b>{rs(i.t)}</b>
            </div>
            <RateItem o={o} item={i} />
          </div>
        ))}
      </div>
      {o.cc ? (
        <div className="orow" style={{ color: 'var(--gr)' }}>
          <span>Coupon {o.cc}</span><b>− {rs(o.cd)}</b>
        </div>
      ) : null}
      <div className="ofoot">
        <div className="otot">Total · Cash on Delivery<b>{rs(o.total)}</b></div>
        {full ? null : (
          <Link className="btn sm" href={'/track/' + o.id}>
            <Icon name="truck" size={16} />Track order
          </Link>
        )}
      </div>
    </div>
  );
}

/* ===== TrackView ===== */
function TrackView({ id = '' }) {
  const { ready, orderIds } = useStore();
  const router = useRouter();
  const [o, setO] = useState(null);
  const [state, setState] = useState('idle'); // idle | load | done

  let oid = id;
  try { oid = decodeURIComponent(id); } catch {}
  oid = (oid || '').toUpperCase().trim();

  useEffect(() => {
    if (!oid || !configured) { setO(null); setState('idle'); return; }
    let off = false;
    setState('load');
    supabase.rpc('track_order', { p_id: oid }).then(({ data }) => {
      if (off) return;
      setO(data || null);
      setState('done');
    });
    return () => { off = true; };
  }, [oid]);

  if (!ready) return <div className="wrap pg pg2" style={{ minHeight: '60vh' }} />;

  const submit = (e) => {
    e.preventDefault();
    const v = e.target.t.value.trim();
    router.push(v ? '/track/' + encodeURIComponent(v) : '/track');
  };

  return (
    <div className="wrap pg pg2">
      <Crumb title="Track Order" />
      <PageHead icon="truck" title="Track Your Order" sub="Enter the Order ID you received after placing your order" />
      <form className="srch" style={{ margin: '4px 0 14px' }} onSubmit={submit} key={oid}>
        <Icon name="search" />
        <input name="t" defaultValue={oid} placeholder="e.g. SM1A2B3C4D5E" aria-label="Order ID" required />
        <button className="btn" style={{ borderRadius: 0, padding: '12px 22px' }}>Track</button>
      </form>

      {oid ? (
        state === 'load' ? (
          <div className="ldg" style={{ minHeight: 160 }}><span /></div>
        ) : o ? (
          <>
            <div className="box">
              <div className={'sth' + (o.st === 4 ? ' dl' : '')}>
                <i><Icon name={SI[o.st]} size={28} /></i>
                <div>
                  <h3>{ST[o.st]}</h3>
                  <p>{SD[o.st]}</p>
                </div>
              </div>
              {o.st === 5 ? null : (
                <ul className="tl2">
                  {ST.slice(0, 5).map((s, i) => {
                    const d = i < o.st || o.st === 4;
                    return (
                      <li key={s} className={d ? 'd' : i === o.st ? 'c' : ''}>
                        <i><Icon name={d ? 'check' : SI[i]} size={16} /></i>
                        <div><b>{s}</b><small>{SD[i]}</small></div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="box">
              <h3><Icon name="pin" size={18} />Delivering to</h3>
              <p>
                <b>{o.addr.name}</b> · {o.addr.phone}<br />
                {o.addr.line}{o.addr.lm ? ', ' + o.addr.lm : ''}<br />
                {o.addr.city}, {o.addr.state} - {o.addr.pin}
              </p>
            </div>
            <OrderBox o={o} full />
          </>
        ) : (
          <Empty
            icon="search"
            title="Order not found"
            text={`No order found for "${oid}". Please check the ID and try again.`}
          />
        )
      ) : orderIds.length ? (
        <div className="box">
          <h3><Icon name="clock" size={18} />Recent orders</h3>
          {orderIds.slice(0, 4).map((x) => (
            <Link key={x} className="btn o sm" style={{ margin: '6px 6px 0 0' }} href={'/track/' + x}>{x}</Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ===== OrdersView ===== */
function OrdersView() {
  const { ready, orderIds } = useStore();
  const [orders, setOrders] = useState(null);
  const key = orderIds.join(',');

  useEffect(() => {
    if (!ready) return;
    if (!orderIds.length || !configured) { setOrders([]); return; }
    let off = false;
    supabase.rpc('get_orders', { p_ids: orderIds.slice(0, 50) }).then(({ data }) => {
      if (!off) setOrders(Array.isArray(data) ? data : []);
    });
    return () => { off = true; };
  }, [ready, key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || orders === null) return <div className="wrap pg pg2" style={{ minHeight: '60vh' }} />;
  return (
    <div className="wrap pg pg2">
      <Crumb title="My Orders" />
      <PageHead
        icon="bag"
        title="My Orders"
        sub={orders.length ? `${orders.length} order${orders.length > 1 ? 's' : ''} placed` : 'Your order history'}
      />
      {orders.length ? (
        orders.map((o) => <OrderBox key={o.id} o={o} />)
      ) : (
        <Empty icon="bag" title="No orders yet" text="Your orders will appear here once you place one." shop />
      )}
    </div>
  );
}

/* ===== ContactView ===== */
function Tile({ href, bg, icon, title, sub, ext }) {
  return (
    <a className="tile" href={href} {...(ext ? { target: '_blank', rel: 'noopener' } : {})}>
      <i style={{ background: bg }}>{icon}</i>
      <div><b>{title}</b><small>{sub}</small></div>
    </a>
  );
}

function ContactView() {
  const { PH, WA, MAIL, IG, IGH, MAP, ADDR } = useCat();
  const send = (e) => {
    e.preventDefault();
    const f = e.target;
    window.open(
      `https://wa.me/${WA}?text=` + encodeURIComponent('Name: ' + f.n.value + '\n' + f.m.value),
      '_blank'
    );
  };
  return (
    <div className="wrap pg" style={{ maxWidth: 760 }}>
      <PageHead icon="phone" title="Contact Us" sub="Orders, bulk enquiries and feedback - we are happy to help" />
      <div className="tiles" style={{ margin: '14px 0' }}>
        {WA ? <Tile href={'tel:+' + WA} bg="#1976d2" icon={<Icon name="phone" size={22} color="#fff" />} title="Call Us" sub={PH || WA} /> : null}
        {WA ? <Tile href={'https://wa.me/' + WA} bg="#25d366" icon={<WaIcon />} title="WhatsApp" sub={PH || WA} ext /> : null}
        {MAIL ? <Tile href={'mailto:' + MAIL} bg="var(--mr)" icon={<Icon name="mail" size={22} color="#fff" />} title="Email" sub={MAIL} /> : null}
        {IG ? <Tile href={IG} bg="linear-gradient(45deg,#f9a03f,#e1306c,#833ab4)" icon={<IgIcon />} title="Instagram" sub={IGH || 'Instagram'} ext /> : null}
        {MAP ? <Tile href={MAP} bg="#ea4335" icon={<Icon name="pin" size={22} color="#fff" />} title="Location" sub={ADDR || 'Open in Maps'} ext /> : null}
      </div>
      <form className="box" onSubmit={send}>
        <h3><Icon name="send" size={18} />Send us a message</h3>
        <label>Your name<input name="n" required /></label>
        <label>Message<textarea name="m" rows={4} required /></label>
        <br />
        <button className="btn w"><WaIcon size={18} />Send on WhatsApp</button>
      </form>
    </div>
  );
}

/* ===== PolicyPage ===== */
/* chips: [icon, text] · sections: [icon, title, content] · other: [href, label, icon] */
function PolicyPage({ icon, title, sub, intro, chips, sections, other }) {
  const { PH, WA, MAIL } = useCat();
  return (
    <div className="wrap pg pg2">
      <Crumb title={title} />
      <PageHead icon={icon} title={title} sub={sub} />
      <p className="pint">{intro}</p>
      <div className="strip" style={{ paddingTop: 0 }}>
        {chips.map((c) => (
          <div key={c[1]}><Icon name={c[0]} size={18} />{c[1]}</div>
        ))}
      </div>
      {sections.map((x) => (
        <section className="box ps" key={x[1]}>
          <i><Icon name={x[0]} size={22} /></i>
          <div>
            <h3>{x[1]}</h3>
            {x[2]}
          </div>
        </section>
      ))}
      <div className="help">
        <div>
          <h3>Questions?</h3>
          <p>Write to {MAIL} or call {PH}.</p>
        </div>
        <div className="acts">
          <a className="btn g" href={`tel:+${WA}`}><Icon name="phone" size={18} />Call Now</a>
          <Link className="btn o" href={other[0]}><Icon name={other[2]} size={18} />{other[1]}</Link>
        </div>
      </div>
    </div>
  );
}

const Ul = ({ items }) => (
  <ul>
    {items.map((x) => <li key={x}>{x}</li>)}
  </ul>
);




const POL_ICONS = ['bag', 'tag', 'cash', 'truck', 'box', 'file', 'shield', 'mail'];
const CHIP_ICONS_T = ['cash', 'truck', 'clock', 'box'];
const CHIP_ICONS_P = ['shield', 'bag', 'file', 'lock'];

function PolicyFromDb({ kind }) {
  const { S } = useCat();
  const isT = kind === 'terms';
  const d = (isT ? S.terms : S.privacy) || {};
  const chipIcons = isT ? CHIP_ICONS_T : CHIP_ICONS_P;
  return (
    <PolicyPage
      icon={isT ? 'file' : 'lock'}
      title={isT ? 'Terms & Conditions' : 'Privacy Policy'}
      sub={isT ? 'Please read before placing an order' : 'How we protect your information'}
      intro={d.intro || ''}
      chips={(d.chips || []).map((t, i) => [chipIcons[i % chipIcons.length], t])}
      sections={(d.sections || []).map((x, i) => [POL_ICONS[i % POL_ICONS.length], x.title, <Ul key={i} items={x.items || []} />])}
      other={isT ? ['/privacy', 'Privacy Policy', 'lock'] : ['/terms', 'Terms & Conditions', 'file']}
    />
  );
}

function TermsView() {
  return <PolicyFromDb kind="terms" />;
}

function PrivacyView() {
  return <PolicyFromDb kind="privacy" />;
}

function NotFoundView() {
  return (
    <div className="wrap pg pg2">
      <Empty
        icon="search"
        title="Page not found"
        text="The page you are looking for does not exist or has moved."
        shop
      />
    </div>
  );
}



/* ===== Router ===== */
const dec = (x) => { try { return decodeURIComponent(x); } catch { return x; } };
const TITLES = {
  cart: 'Your Cart', address: 'Delivery Address', payment: 'Bill & Payment',
  'order-success': 'Order Placed', track: 'Track Order', orders: 'My Orders',
  contact: 'Contact Us', terms: 'Terms & Conditions', privacy: 'Privacy Policy',
};
const MAX_PARTS = { cart: 1, address: 1, payment: 1, orders: 1, contact: 1, terms: 1, privacy: 1, track: 2, product: 2, 'order-success': 2 };

function parsePath(path) {
  return (path || '/').split('?')[0].split('/').filter(Boolean).map(dec);
}
function titleFor(path, findProduct, BN, TAGLINE) {
  const [a, b] = parsePath(path);
  if (!a) return TAGLINE ? `${BN} - ${TAGLINE}` : BN;
  const t = a === 'product' ? (findProduct(b) || {}).n : TITLES[a];
  return (t || 'Page not found') + ' | ' + BN;
}
function renderRoute(path, findProduct) {
  const parts = parsePath(path);
  const [a, b] = parts;
  if (!a) return <HomeView />;
  if (parts.length > (MAX_PARTS[a] || 0)) return <NotFoundView />;
  switch (a) {
    case 'product': return findProduct(b) ? <ProductDetail key={b} id={b} /> : <NotFoundView />;
    case 'cart': return <CartView />;
    case 'address': return <AddressView />;
    case 'payment': return <PaymentView />;
    case 'order-success': return b ? <DoneView id={b} /> : <NotFoundView />;
    case 'track': return <TrackView id={b || ''} />;
    case 'orders': return <OrdersView />;
    case 'contact': return <ContactView />;
    case 'terms': return <TermsView />;
    case 'privacy': return <PrivacyView />;
    default: return <NotFoundView />;
  }
}
function Router() {
  const { BN, TAGLINE, findProduct } = useCat();
  const path = usePathname();
  useEffect(() => {
    if (path === null) return;
    document.title = titleFor(path, findProduct, BN, TAGLINE);
    window.scrollTo(0, 0);
  }, [path, BN, TAGLINE]); // eslint-disable-line react-hooks/exhaustive-deps
  if (path === null) return <div style={{ minHeight: '60vh' }} />;
  return renderRoute(path, findProduct);
}

export {
  Router, renderRoute, StoreProvider, SiteShell, HomeView, ProductDetail, CartView, AddressView, PaymentView,
  DoneView, TrackView, OrdersView, ContactView, TermsView, PrivacyView, NotFoundView,
};
