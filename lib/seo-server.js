/*
 * Server-only SEO helpers: read the live catalog from Supabase (public anon
 * key, same data the storefront already shows) so that metadata, JSON-LD,
 * sitemap.xml and llms.txt always match what is really on the shop.
 *
 * Every function fails soft: if Supabase is unreachable or not configured,
 * sensible brand-level defaults are used and the build / page never breaks.
 */
import { cache } from 'react';
import { headers } from 'next/headers';
import {
  BRAND, SITE_URL, PAGES, OG_IMAGE, ROBOTS_INDEX, ROBOTS_NOINDEX,
  abs, clip, graph, socialMeta, rupees,
  productTitle, productKeywords, productDescription,
  organizationNode, websiteNode, navigationNode, breadcrumbNode, webPageNode, ID,
} from '@/lib/seo';

const SUPA_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const CONFIGURED = !!SUPA_URL && !!SUPA_KEY && !/YOUR-PROJECT|YOUR-ANON/i.test(SUPA_URL + SUPA_KEY);

const DEFAULTS = { brand_name: BRAND.name, free_ship_min: 499, ship_fee: 40, delivery_days: '3-5 days' };

/** Tiny PostgREST GET. Returns parsed JSON, or null on any problem. */
async function sb(path, revalidate = 300) {
  if (!CONFIGURED) return null;
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Accept: 'application/json' },
      next: { revalidate },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const safeId = (id) => (typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null);

/* ---------------- settings ---------------- */
export const getSettings = cache(async () => {
  const rows = await sb('site_settings?id=eq.1&select=*');
  const row = Array.isArray(rows) && rows[0] ? rows[0] : {};
  const S = { ...DEFAULTS };
  Object.keys(row).forEach((k) => { if (row[k] !== null && row[k] !== '') S[k] = row[k]; });
  S.free_ship_min = Number(S.free_ship_min) || 0;
  S.ship_fee = Number(S.ship_fee) || 0;
  return S;
});

/* ---------------- products ---------------- */
function mapProduct(p, catName, rating) {
  const pk = (Array.isArray(p.packs) ? p.packs : [])
    .filter((k) => k && k.label && Number(k.price) > 0)
    .map((k) => ({ l: String(k.label), p: Number(k.price), m: Number(k.mrp) > Number(k.price) ? Number(k.mrp) : Number(k.price) }));
  return {
    id: p.id,
    n: p.name || '',
    c: catName || 'Other',
    cap: p.caption || '',
    d: p.description || '',
    g: p.ingredients || '',
    imgs: (p.images || []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u)),
    stock: p.in_stock !== false,
    pk,
    r: rating ? Number(rating.avg_rating) : 0,
    rc: rating ? Number(rating.review_count) : 0,
  };
}

/** All active products that the storefront really shows (at least one valid pack). */
export const getProducts = cache(async () => {
  const [prods, cats] = await Promise.all([
    sb('products?is_active=eq.true&select=*&order=sort_order.asc,id.asc'),
    sb('categories?is_active=eq.true&select=id,name'),
  ]);
  if (!Array.isArray(prods)) return [];
  const catById = new Map((Array.isArray(cats) ? cats : []).map((c) => [c.id, c.name]));
  return prods
    .filter((p) => !p.category_id || catById.has(p.category_id))
    .map((p) => mapProduct(p, catById.get(p.category_id)))
    .filter((p) => p.n && p.pk.length);
});

/** One product. status: 'ok' | 'missing' | 'error' */
export const getProduct = cache(async (rawId) => {
  const id = safeId(rawId);
  if (!id) return { status: 'missing' }; // malformed id can never be a real product
  const rows = await sb(`products?id=eq.${encodeURIComponent(id)}&is_active=eq.true&select=*`, 60);
  if (!Array.isArray(rows)) return { status: 'error' };
  if (!rows.length) return { status: 'missing' };
  const row = rows[0];
  const [cat, rat] = await Promise.all([
    row.category_id != null ? sb(`categories?id=eq.${encodeURIComponent(row.category_id)}&select=id,name,is_active`, 300) : Promise.resolve(null),
    sb(`product_ratings?product_id=eq.${encodeURIComponent(id)}&select=*`, 300),
  ]);
  const catRow = Array.isArray(cat) ? cat[0] : null;
  if (row.category_id != null && Array.isArray(cat) && !catRow) return { status: 'missing' };
  const product = mapProduct(row, catRow && catRow.name, Array.isArray(rat) ? rat[0] : null);
  if (!product.pk.length) return { status: 'missing' };
  return { status: 'ok', product };
});

/* ---------------- which product is this request for? ---------------- */
/* next.config rewrites /product/:id -> /product, so the id is not in params.
   middleware.js copies the original path into a header we read here. */
async function requestedProductId() {
  try {
    const h = await headers();
    const path = h.get('x-sm-pathname') || '';
    const m = path.match(/^\/product\/([^/]+)\/?$/);
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch { return m[1]; }
  } catch {
    return null;
  }
}

/* ---------------- metadata ---------------- */
export async function productMetadata() {
  const id = await requestedProductId();
  const generic = {
    title: { absolute: PAGES.product.title },
    description: PAGES.product.description,
    keywords: PAGES.product.keywords,
    robots: ROBOTS_NOINDEX,
    ...socialMeta({ title: PAGES.product.title, description: PAGES.product.description, path: '/product' }),
  };
  if (!id) return generic;

  const [S, res] = await Promise.all([getSettings(), getProduct(id)]);
  const BN = S.brand_name || BRAND.name;
  const path = `/product/${encodeURIComponent(id)}`;

  if (res.status === 'missing') {
    return { ...generic, alternates: { canonical: path } };
  }
  if (res.status !== 'ok') {
    // Could not reach the catalog: keep the page indexable but generic, canonical to itself.
    return {
      ...generic,
      robots: ROBOTS_INDEX,
      title: { absolute: `Product | ${BN}` },
      alternates: { canonical: path },
    };
  }

  const p = res.product;
  const title = productTitle(p.n, BN);
  const description = productDescription(p, BN);
  const low = Math.min(...p.pk.map((k) => k.p));
  const image = p.imgs[0];
  return {
    title: { absolute: title },
    description,
    keywords: productKeywords(p.n, p.c, BN),
    alternates: { canonical: path, languages: { 'en-IN': path, 'x-default': path } },
    robots: ROBOTS_INDEX,
    ...socialMeta({ title, description, path, image, imageAlt: p.n }),
    other: {
      'product:price:amount': String(low),
      'product:price:currency': 'INR',
      'product:availability': p.stock ? 'in stock' : 'out of stock',
      'product:brand': BN,
      'product:category': p.c,
    },
  };
}

/* ---------------- JSON-LD ---------------- */
const nodes = (S, key, page, ...more) => [
  organizationNode(S),
  websiteNode(),
  ...(key === 'home' ? [navigationNode()] : []),
  page,
  breadcrumbNode(key),
  ...more,
];

export async function staticSchema(key, faq) {
  const S = await getSettings();
  const page = webPageNode(key);
  return graph(nodes(S, key, page, faq ? faqNode(PAGES[key].path, faq) : null));
}

export async function homeSchema() {
  const [S, products] = await Promise.all([getSettings(), getProducts()]);
  const list = products.length
    ? {
        '@type': 'ItemList',
        '@id': `${SITE_URL}/#products`,
        name: `${S.brand_name || BRAND.name} products`,
        numberOfItems: Math.min(products.length, 100),
        itemListElement: products.slice(0, 100).map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: abs(`/product/${p.id}`),
          name: p.n,
        })),
      }
    : null;
  const page = webPageNode('home', list ? { extra: { mainEntity: { '@id': `${SITE_URL}/#products` } } } : {});
  return graph(nodes(S, 'home', page, list));
}

export async function productSchema() {
  const id = await requestedProductId();
  if (!id) return null;
  const [S, res] = await Promise.all([getSettings(), getProduct(id)]);
  if (res.status !== 'ok') return null;
  const p = res.product;
  const BN = S.brand_name || BRAND.name;
  const path = `/product/${encodeURIComponent(id)}`;
  const url = abs(path);
  const images = p.imgs.length ? p.imgs.slice(0, 8) : [abs(OG_IMAGE.url)];
  const cleanDesc = String(p.d || p.cap || `${p.n} from ${BN}`).replace(/\s+/g, ' ').trim().slice(0, 4900);

  const offers = p.pk.map((k) => ({
    '@type': 'Offer',
    '@id': `${url}#offer-${encodeURIComponent(k.l)}`,
    name: `${p.n} - ${k.l}`,
    sku: `SM-${id}-${String(k.l).toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    url,
    price: k.p,
    priceCurrency: 'INR',
    availability: p.stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': ID.org() },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: S.free_ship_min && k.p >= S.free_ship_min ? 0 : S.ship_fee,
        currency: 'INR',
      },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
    },
  }));

  const product = {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: p.n,
    description: cleanDesc,
    image: images,
    sku: `SM-${id}`,
    brand: { '@type': 'Brand', name: BN },
    manufacturer: { '@id': ID.org() },
    category: p.c,
    url,
    offers,
    ...(p.g ? { additionalProperty: [{ '@type': 'PropertyValue', name: 'Ingredients', value: String(p.g).slice(0, 500) }] } : {}),
    ...(p.rc > 0 && p.r > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(p.r.toFixed(1)), reviewCount: p.rc, bestRating: 5, worstRating: 1 } }
      : {}),
  };

  const page = webPageNode('product', {
    path,
    name: productTitle(p.n, BN),
    description: productDescription(p, BN),
    type: 'ItemPage',
    extra: { mainEntity: { '@id': `${url}#product` }, primaryImageOfPage: { '@type': 'ImageObject', url: images[0] } },
  });
  const crumbs = breadcrumbNodeForProduct(path, p.n);
  return graph([organizationNode(S), websiteNode(), page, crumbs, product]);
}

function breadcrumbNodeForProduct(path, name) {
  const url = abs(path);
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
      { '@type': 'ListItem', position: 2, name, item: url },
    ],
  };
}

function faqNode(path, items) {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(path)}#faq`,
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/* FAQ text below mirrors what is written on the visible policy pages
   (see app/Compliance.jsx), so the markup always matches page content. */
export async function shippingFaq() {
  const S = await getSettings();
  return [
    ['How long does Sahchari Masale take to deliver?',
      `${S.delivery_days ? `Estimated delivery: ${S.delivery_days}. ` : ''}This is an estimate. The exact time depends on our delivery partner, your location and the day of dispatch.`],
    ['Does Sahchari Masale deliver across India?', 'Yes. We ship pan-India through trusted delivery partners.'],
    ['Which payment methods are available?', 'Payment methods are shown at checkout: Cash on Delivery and/or online UPI payment. For Cash on Delivery please keep the exact amount ready.'],
    ['How do I track my Sahchari Masale order?', 'Use the Track Order page with your Order ID. The delivery partner may also send you updates by SMS or call.'],
    ['What are the delivery charges?', 'Any delivery charge, or free delivery, is shown on the Bill & Payment page before you place the order.'],
  ];
}

export function refundFaq() {
  return [
    ['When do I get a replacement or refund from Sahchari Masale?',
      'If you receive a different product, mixed products, a damaged, leaking or tampered pack, or a short quantity, we send a replacement again or refund you, whichever you prefer.'],
    ['Is an unboxing video required?',
      'Yes. Record one continuous, uncut video from the sealed parcel to opening every pack, with the shipping label and Order ID visible at the start. Without it we may not be able to accept a mix-up or damage claim.'],
    ['How do I claim a replacement or refund?',
      `Within ${BRAND.reportWindow} of delivery, send the video and your Order ID on WhatsApp ${BRAND.phone} or to ${BRAND.email}. We normally confirm within 2 working days.`],
    ['How are refunds paid?',
      'The refund goes to your bank account or UPI ID after you share the details. It is usually completed in 5 to 7 working days after approval.'],
    ['What is not covered?',
      'Change of mind, opened packs that were delivered correctly, damage caused after delivery, and claims made after the reporting time.'],
  ];
}

/* ---------------- text used by llms.txt ---------------- */
export async function llmsText() {
  const [S, products] = await Promise.all([getSettings(), getProducts()]);
  const BN = S.brand_name || BRAND.name;
  const L = [];
  L.push(`# ${BN}`, '');
  L.push(`> ${BRAND.description}`, '');
  L.push('## Business facts', '');
  L.push(`- Brand: ${BN} (also searched as Sahchari Masala)`);
  L.push(`- Legal name: ${BRAND.legalName}`);
  L.push(`- Website: ${SITE_URL}/`);
  L.push(`- Address: Mat Mulla Bangar, P.O. Mat, Distt. Mathura, Uttar Pradesh 281202, India`);
  L.push(`- Phone / WhatsApp: ${BRAND.phone}`);
  L.push(`- Email: ${S.email || BRAND.email}`);
  L.push(`- FSSAI licence no.: ${BRAND.fssai}`);
  L.push(`- GST no.: ${BRAND.gst}`);
  L.push(`- Payment: Cash on Delivery and online UPI payment, as shown at checkout`);
  L.push(`- Shipping: pan-India through delivery partners${S.delivery_days ? `; estimated ${S.delivery_days}` : ''}`);
  if (S.free_ship_min) L.push(`- Delivery charge: ${rupees(S.ship_fee)}; free delivery on orders of ${rupees(S.free_ship_min)} or more`);
  L.push(`- Replacement / refund: free for wrong, damaged or short products if reported within ${BRAND.reportWindow} with an unboxing video`);
  if (/^https?:\/\//i.test(S.instagram_url || '')) L.push(`- Instagram: ${S.instagram_url}`);
  L.push('');
  L.push('## Pages', '');
  [['home', 'Home - shop all spices'], ['contact', 'Contact - call, WhatsApp, email'], ['shipping', 'Shipping & delivery policy'],
    ['refund', 'Replacement & refund policy'], ['terms', 'Terms & conditions'], ['privacy', 'Privacy policy']].forEach(([k, label]) => {
    L.push(`- [${label}](${abs(PAGES[k].path)}): ${PAGES[k].description}`);
  });
  if (products.length) {
    L.push('', '## Products', '');
    products.slice(0, 200).forEach((p) => {
      const low = Math.min(...p.pk.map((k) => k.p));
      const packs = p.pk.map((k) => k.l).join(', ');
      const blurb = clip(p.cap || p.d, 110);
      L.push(`- [${p.n}](${abs(`/product/${p.id}`)}): ${[blurb, `packs ${packs}`, `from ${rupees(low)}`, p.stock ? 'in stock' : 'out of stock'].filter(Boolean).join(' | ')}`);
    });
  }
  L.push('', `Sitemap: ${SITE_URL}/sitemap.xml`, '');
  return L.join('\n');
}


/** First active hero banner image URL (used to preload the LCP image on the home page). */
export const getHeroImage = cache(async () => {
  const rows = await sb('hero_slides?is_active=eq.true&select=image_url&order=sort_order.asc,id.asc&limit=1');
  const u = Array.isArray(rows) && rows[0] ? rows[0].image_url : '';
  return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : '';
});
