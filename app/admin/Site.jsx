'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import logo from './logo.png';
import { supabase, configured } from '@/lib/supabase';
import {
  IC, ST, SD, SI, rs, pimg, cimg, packInfo, chk, computeBill, fdate, buildCatalog, mapCoupon,
} from './data';

const DEFAULT_LOGO = logo.src || logo;

/* Catalog (settings, categories, products, banners, coupons) - loaded from Supabase */
const CatCtx = createContext(null);
const useCat = () => useContext(CatCtx);

/* ---------- Hash routing (#/cart, #/product/3 ...) - koi route folder nahi chahiye ---------- */
const toHash = (h) => '#' + (h.startsWith('/') ? h : '/' + h);

function Link({ href, children, ...rest }) {
  return <a href={toHash(href)} {...rest}>{children}</a>;
}
function useRouter() {
  return useMemo(() => ({
    push: (h) => { window.location.hash = toHash(h); },
    replace: (h) => { window.location.replace(toHash(h)); },
  }), []);
}
// null = abhi browser me load nahi hua
function usePathname() {
  const [p, setP] = useState(null);
  useEffect(() => {
    const f = () => setP(window.location.hash.slice(1) || '/');
    f();
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return p;
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
