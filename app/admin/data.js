export const IC={share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',truck:'<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',bag:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',phone:'<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',cart:'<circle cx="9" cy="20" r="1.500"/><circle cx="18" cy="20" r="1.500"/><path d="M2 3h3l2.500 12h11L21 7H6"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',pin:'<path d="M12 21s7-6.500 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12z"/><circle cx="12" cy="9" r="2.500"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',shield:'<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',leaf:'<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z"/><path d="M5 19l7-7"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',back:'<path d="M15 5l-7 7 7 7"/>',next:'<path d="M9 5l7 7-7 7"/>',sort:'<path d="M4 6h16M7 12h10M10 18h4"/>',down:'<path d="M12 5v14M5 12l7 7 7-7"/>',chev:'<path d="M6 9l6 6 6-6"/>',star:'<path d="M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100-4.400-4.300 6.100-.9z"/>',tag:'<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.500" cy="7.500" r="1.500"/>',check:'<path d="M5 12l5 5 9-10"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',file:'<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h8"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',box:'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',up:'<path d="M12 19V5M5 12l7-7 7 7"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',send:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'};

/* ---------- Order status ---------- */
export const ST = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
export const SD = [
  'We have received your order',
  'Your order is packed and ready to ship',
  'Your order is on its way',
  'Arriving today, keep your phone handy',
  'Your order has been delivered',
  'This order has been cancelled',
];
export const SI = ['bag', 'box', 'truck', 'pin', 'check', 'x'];

/* ---------- Default store settings (real values come from Supabase) ---------- */
export const DEFAULT_SETTINGS = {
  brand_name: 'Sahchari Masale',
  tagline: '',
  logo_url: '',
  phone_display: '',
  whatsapp: '',
  email: '',
  instagram_url: '',
  instagram_handle: '',
  instagram_followers: '',
  map_url: '',
  address: '',
  free_ship_min: 499,
  ship_fee: 40,
  delivery_days: '3-5 days',
  announcements: [],
  strip_items: [],
  why_items: [],
  terms: null,
  privacy: null,
};

export const rs = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export const fdate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/* ---------- Images (uploaded by admin; neutral placeholder when missing) ---------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const svgUri = (s) => 'data:image/svg+xml,' + encodeURIComponent(s);

export const pimg = (p, i = 0) => {
  const u = p && p.imgs && p.imgs[i];
  if (u) return u;
  const ch = esc(((p && p.n) || '?').trim().charAt(0).toUpperCase() || '?');
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#fff4dc"/><circle cx="200" cy="190" r="110" fill="#fff" opacity=".7"/><text x="200" y="232" font-size="120" font-weight="700" text-anchor="middle" fill="#5a1010" font-family="sans-serif">${ch}</text></svg>`
  );
};

export const cimg = (c) => {
  if (c && c.image_url) return c.image_url;
  const ch = c && c.name && c.name !== 'All' ? esc(c.name.trim().charAt(0).toUpperCase()) : '★';
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f7e6b8"/><text x="40" y="54" font-size="38" font-weight="700" text-anchor="middle" fill="#5a1010" font-family="sans-serif">${ch}</text></svg>`
  );
};

/* "250 g" -> { q: 250, u: 'g' } ; "1 kg" -> { q: 1000, u: 'g' } ; unknown -> { q: 0, u: '' } */
export const packInfo = (label) => {
  const m = String(label || '').toLowerCase().match(/([\d.]+)\s*(kg|gm|gms|gram|grams|g|ml|ltr|litre|l)\b/);
  if (!m) return { q: 0, u: '' };
  const n = parseFloat(m[1]);
  if (!n) return { q: 0, u: '' };
  const u = m[2];
  if (u === 'kg') return { q: n * 1000, u: 'g' };
  if (u === 'ltr' || u === 'litre' || u === 'l') return { q: n * 1000, u: 'ml' };
  if (u === 'ml') return { q: n, u: 'ml' };
  return { q: n, u: 'g' };
};

/* ---------- Coupons ---------- */
export const mapCoupon = (r, catName) => ({
  c: String(r.code || '').toUpperCase(),
  t: r.title || '',
  d: r.description || '',
  min: Number(r.min_order || 0),
  pct: r.discount_type === 'percent' ? Number(r.value) : undefined,
  flat: r.discount_type === 'flat' ? Number(r.value) : undefined,
  ship: r.discount_type === 'ship' ? 1 : undefined,
  max: r.max_discount != null ? Number(r.max_discount) : 1e9,
  cat: catName || '',
  pub: r.is_public ? 1 : 0,
  exp: r.expires_at || null,
});

/* ---------- Turn raw Supabase rows into what the shop UI uses ---------- */
export function buildCatalog(raw, extra = {}) {
  const S = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
  S.announcements = (S.announcements || []).filter(Boolean);
  S.strip_items = (S.strip_items || []).filter(Boolean);
  S.why_items = Array.isArray(S.why_items) ? S.why_items : [];
  S.free_ship_min = Number(S.free_ship_min) || 0;
  S.ship_fee = Number(S.ship_fee) || 0;

  const cats = raw.cats || [];
  const catById = new Map(cats.map((c) => [c.id, c]));
  const ratings = new Map((raw.ratings || []).map((r) => [r.product_id, r]));

  const P = (raw.products || [])
    .filter((p) => !p.category_id || catById.has(p.category_id))
    .map((p) => {
      const cat = catById.get(p.category_id);
      const st = ratings.get(p.id);
      return {
        id: p.id,
        n: p.name,
        c: cat ? cat.name : 'Other',
        cid: p.category_id,
        cap: p.caption || '',
        d: p.description || '',
        g: p.ingredients || '',
        t: p.tag || '',
        tc: p.tag_color || '#d9a21b',
        imgs: (p.images || []).filter(Boolean),
        stock: p.in_stock !== false,
        pk: (Array.isArray(p.packs) ? p.packs : [])
          .filter((k) => k && k.label && Number(k.price) > 0)
          .map((k) => ({
            l: String(k.label),
            p: Number(k.price),
            m: Number(k.mrp) > Number(k.price) ? Number(k.mrp) : Number(k.price),
          })),
        r: st ? Number(st.avg_rating) : 0,
        rc: st ? Number(st.review_count) : 0,
      };
    })
    .filter((p) => p.pk.length);

  const CATOBJ = [{ name: 'All', image_url: '', banner_url: '' }, ...cats.map((c) => ({ id: c.id, name: c.name, image_url: c.image_url || '', banner_url: c.banner_url || '' }))];
  const CATS = CATOBJ.map((c) => c.name);

  const SL = (raw.slides || []).map((s) => ({
    id: s.id,
    t: s.title || '',
    s: s.subtitle || '',
    c: (catById.get(s.category_id) || {}).name || '',
    img: s.image_url || '',
  }));

  const now = Date.now();
  const CP = (raw.coupons || [])
    .filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now)
    .map((r) => mapCoupon(r, (catById.get(r.category_id) || {}).name))
    .filter((x) => x.pub);

  const byCode = {};
  CP.forEach((x) => { byCode[x.c] = x; });
  Object.keys(extra).forEach((k) => { byCode[k] = extra[k]; });

  const pById = new Map(P.map((p) => [String(p.id), p]));
  const findProduct = (id) => pById.get(String(id));
  const findCoupon = (code) => byCode[String(code || '').trim().toUpperCase()];

  const FREE_SHIP = S.free_ship_min;
  const SHIP_FEE = S.ship_fee;

  return {
    S, P, CATS, CATOBJ, SL, CP,
    findProduct, findCoupon,
    env: { findProduct, findCoupon, FREE_SHIP, SHIP_FEE },
    BN: S.brand_name,
    TAGLINE: S.tagline,
    PH: S.phone_display,
    WA: String(S.whatsapp || '').replace(/\D/g, ''),
    MAIL: S.email,
    IG: S.instagram_url,
    IGH: [S.instagram_handle, S.instagram_followers].filter(Boolean).join(' · '),
    MAP: S.map_url,
    ADDR: S.address,
    FREE_SHIP,
  };
}

/* ---------- Cart maths + coupons ---------- */
export const getLines = (cart, env) =>
  cart
    .map((c) => {
      const p = env.findProduct(c.id);
      if (!p || !p.stock) return null;
      const k = p.pk[c.k];
      if (!k) return null;
      return { ...c, p, k, tot: k.p * c.q, mrp: k.m * c.q };
    })
    .filter(Boolean);

/** Check whether coupon `cp` can be applied on bill `b` (bill WITHOUT coupon). */
export function chk(cp, b) {
  if (cp.ship)
    return b.ship
      ? { ok: 1, d: b.ship }
      : { ok: 0, m: 'Your order already has free delivery' };
  const base = cp.cat
    ? b.L.filter((l) => l.p.c == cp.cat).reduce((a, l) => a + l.tot, 0)
    : b.pay;
  if (base < cp.min)
    return {
      ok: 0,
      m:
        cp.cat && !base
          ? `Add ${cp.cat} worth ${rs(cp.min)} to your cart to use this`
          : `Add ${rs(cp.min - base)} more${cp.cat ? ' of ' + cp.cat : ''} to your cart to unlock`,
    };
  return {
    ok: 1,
    d: Math.min(
      cp.flat || Math.min(Math.round((base * cp.pct) / 100), cp.max),
      base
    ),
  };
}

/** Pure bill calculation. Coupon is applied only if it is valid for this cart. */
export function computeBill(cart, coupon, env) {
  const L = getLines(cart, env);
  const sub = L.reduce((a, l) => a + l.mrp, 0);
  const pay = L.reduce((a, l) => a + l.tot, 0);
  const ship = pay >= env.FREE_SHIP || !pay ? 0 : env.SHIP_FEE;
  const b = { L, sub, disc: sub - pay, ship, pay, cd: 0, cc: '', total: pay + ship, badCoupon: false };
  if (coupon) {
    const cp = env.findCoupon(coupon);
    const k = cp && chk(cp, b);
    if (k && k.ok) {
      b.cd = k.d;
      b.cc = cp.c;
      b.total = pay + ship - k.d;
    } else b.badCoupon = true;
  }
  return b;
}
