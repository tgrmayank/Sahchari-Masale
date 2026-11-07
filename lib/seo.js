/*
 * Central SEO configuration for Sahchari Masale.
 * Pure data + helpers (no Node / Next-only APIs) so it can be used from
 * server components, route handlers AND the client Router.
 *
 * Change the brand facts here once - every page, the sitemap, robots, llms.txt
 * and the JSON-LD schema pick them up.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sahcharimasale.in').replace(/\/+$/, '');

export const BRAND = {
  name: 'Sahchari Masale',
  legalName: 'SAHCHARI MASALE',
  alternateNames: ['Sahchari Masala', 'Sahchari Spices', 'sahcharimasale.in', 'सहचारी मसाले'],
  slogan: 'शुद्ध • प्राकृतिक • स्वादिष्ट (Pure • Natural • Tasty)',
  description:
    'Sahchari Masale is an Indian spice (masale) brand from Mat, Mathura, Uttar Pradesh. We source, select, process and pack authentic Indian spices and deliver them across India with Cash on Delivery. FSSAI licensed.',
  phone: '+91-8368752030',
  email: 'sahcharimasale@gmail.com',
  gst: '09CQBPD3237M1ZS',
  fssai: '22726130000127',
  address: {
    streetAddress: 'Mat Mulla Bangar, P.O. Mat, Distt. Mathura',
    addressLocality: 'Mathura',
    addressRegion: 'Uttar Pradesh',
    postalCode: '281202',
    addressCountry: 'IN',
  },
  // Mathura district centre - used only for the geo meta tags (approximate on purpose).
  geo: { lat: 27.4924, lng: 77.6737, region: 'IN-UP', placename: 'Mathura, Uttar Pradesh' },
  themeColor: '#5a1010',
  reportWindow: '48 hours',
};

export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Sahchari Masale - Pure Indian spices (shuddh, prakritik, swadisht)',
};

export const LOGO_PATH = '/logo.png';

/* Favicon set (Google needs a square icon in multiples of 48px + /favicon.ico) */
export const ICONS = {
  icon: [
    { url: '/favicon.ico', sizes: 'any' },
    { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
    { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
    { url: '/icon-144.png', sizes: '144x144', type: 'image/png' },
    { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  ],
  shortcut: '/favicon.ico',
  apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
};

/* Main pages that Google may show as sitelink buttons under the brand result. */
export const NAV_PAGES = [
  ['home', 'Shop All Spices'],
  ['contact', 'Contact Us'],
  ['shipping', 'Shipping & Delivery'],
  ['refund', 'Refund & Replacement'],
  ['terms', 'Terms & Conditions'],
  ['privacy', 'Privacy Policy'],
];

export const abs = (path = '/') => (/^https?:\/\//i.test(path) ? path : SITE_URL + (path.startsWith('/') ? path : '/' + path));

/* ------------------------------------------------------------------ */
/* Robots directives                                                  */
/* ------------------------------------------------------------------ */
export const ROBOTS_INDEX = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};
export const ROBOTS_NOINDEX = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true, 'max-image-preview': 'none', 'max-snippet': 0 },
};

/* ------------------------------------------------------------------ */
/* Per-page SEO data. Every page has title, description and 10 keywords. */
/* ------------------------------------------------------------------ */
export const PAGES = {
  home: {
    path: '/',
    index: true,
    schemaType: 'CollectionPage',
    crumb: 'Home',
    priority: 1.0,
    changeFrequency: 'daily',
    title: 'Sahchari Masale | Buy Pure Indian Spices & Masale Online',
    description:
      'Sahchari Masale official store: buy pure, authentic Indian spices & masale online. FSSAI licensed, made in Mathura (UP), Cash on Delivery across India.',
    keywords: [
      'Sahchari Masale',
      'Sahchari Masala',
      'Sahchari Masale online',
      'Sahchari Masale Mathura',
      'buy spices online India',
      'pure Indian masale',
      'garam masala powder online',
      'सहचारी मसाले',
      'FSSAI licensed spices',
      'spices cash on delivery',
    ],
  },
  product: {
    path: '/product',
    index: false,
    schemaType: 'ItemPage',
    crumb: 'Product',
    title: 'Sahchari Masale Product Details | Buy Spices Online',
    description:
      'View product details, pack sizes, prices, ingredients and customer reviews at Sahchari Masale. Order online with Cash on Delivery.',
    keywords: [
      'Sahchari Masale products',
      'Sahchari Masale product details',
      'buy Sahchari Masale spices',
      'Sahchari Masale price',
      'Sahchari Masale pack sizes',
      'Sahchari Masale ingredients',
      'Sahchari Masale reviews',
      'Sahchari Masale masale online',
      'pure Indian spices online',
      'Sahchari Masale cash on delivery',
    ],
  },
  cart: {
    path: '/cart',
    index: false,
    crumb: 'Cart',
    title: 'Sahchari Masale Cart | Your Spices Cart',
    description: 'Review the spices in your cart, apply a coupon and check out with Cash on Delivery at Sahchari Masale.',
    keywords: [
      'Sahchari Masale cart',
      'Sahchari Masale checkout',
      'buy masale online cart',
      'spices cart India',
      'Sahchari Masale coupon code',
      'Sahchari Masale offers',
      'Sahchari Masale order online',
      'cash on delivery checkout',
      'Sahchari Masale discount',
      'Sahchari Masale free delivery',
    ],
  },
  address: {
    path: '/address',
    index: false,
    crumb: 'Delivery Address',
    title: 'Sahchari Masale Delivery Address | Checkout',
    description: 'Enter your name, mobile number and delivery address to get your Sahchari Masale spices delivered to your door.',
    keywords: [
      'Sahchari Masale delivery address',
      'Sahchari Masale checkout address',
      'spices home delivery address',
      'Sahchari Masale pincode delivery',
      'Sahchari Masale order delivery',
      'online masale delivery India',
      'Sahchari Masale COD order',
      'Sahchari Masale shipping address',
      'Sahchari Masale checkout',
      'buy spices online India',
    ],
  },
  payment: {
    path: '/payment',
    index: false,
    crumb: 'Bill & Payment',
    title: 'Sahchari Masale Bill & Payment | Cash on Delivery',
    description: 'Check your bill, delivery charge and total, then place your Sahchari Masale order with Cash on Delivery.',
    keywords: [
      'Sahchari Masale payment',
      'Sahchari Masale cash on delivery',
      'Sahchari Masale bill summary',
      'Sahchari Masale COD',
      'Sahchari Masale coupon',
      'Sahchari Masale place order',
      'pay on delivery spices India',
      'Sahchari Masale order total',
      'Sahchari Masale checkout',
      'Sahchari Masale delivery charge',
    ],
  },
  'order-success': {
    path: '/order-success',
    index: false,
    crumb: 'Order Placed',
    title: 'Sahchari Masale Order Placed | Thank You',
    description: 'Thank you! Your Sahchari Masale order is placed. Save your Order ID to track the delivery.',
    keywords: [
      'Sahchari Masale order confirmation',
      'Sahchari Masale order placed',
      'Sahchari Masale order ID',
      'Sahchari Masale track order',
      'Sahchari Masale COD order',
      'Sahchari Masale thank you',
      'Sahchari Masale order status',
      'Sahchari Masale delivery update',
      'Sahchari Masale order details',
      'Sahchari Masale support',
    ],
  },
  track: {
    path: '/track',
    index: false,
    crumb: 'Track Order',
    title: 'Track Your Sahchari Masale Order | Order Status',
    description: 'Track your Sahchari Masale order with your Order ID and see whether it is packed, shipped or out for delivery.',
    keywords: [
      'track Sahchari Masale order',
      'Sahchari Masale order tracking',
      'Sahchari Masale order status',
      'Sahchari Masale delivery status',
      'Sahchari Masale parcel tracking',
      'where is my Sahchari Masale order',
      'Sahchari Masale order ID',
      'Sahchari Masale courier tracking',
      'spices order tracking India',
      'Sahchari Masale delivery update',
    ],
  },
  orders: {
    path: '/orders',
    index: false,
    crumb: 'My Orders',
    title: 'Sahchari Masale My Orders | Order History',
    description: 'See the Sahchari Masale orders placed from this device and open any order to check its status.',
    keywords: [
      'Sahchari Masale my orders',
      'Sahchari Masale order history',
      'Sahchari Masale past orders',
      'Sahchari Masale reorder',
      'Sahchari Masale order status',
      'Sahchari Masale order ID',
      'Sahchari Masale track order',
      'Sahchari Masale customer orders',
      'Sahchari Masale purchase history',
      'Sahchari Masale account orders',
    ],
  },
  contact: {
    path: '/contact',
    index: true,
    schemaType: 'ContactPage',
    crumb: 'Contact Us',
    priority: 0.7,
    changeFrequency: 'monthly',
    title: 'Sahchari Masale Contact | Call, WhatsApp & Email',
    description:
      'Contact Sahchari Masale, Mat, Mathura (U.P.): call or WhatsApp +91-8368752030 or email sahcharimasale@gmail.com for orders, bulk enquiries and support.',
    keywords: [
      'Sahchari Masale contact number',
      'Sahchari Masale phone number',
      'Sahchari Masale WhatsApp',
      'Sahchari Masale customer care',
      'Sahchari Masale email',
      'Sahchari Masale address Mathura',
      'Sahchari Masale bulk order',
      'spices wholesale enquiry Mathura',
      'Sahchari Masale near me',
      'masale supplier Mathura',
    ],
  },
  terms: {
    path: '/terms',
    index: true,
    schemaType: 'WebPage',
    crumb: 'Terms & Conditions',
    priority: 0.3,
    changeFrequency: 'yearly',
    title: 'Sahchari Masale Terms & Conditions | Seller, GST & FSSAI',
    description:
      'Terms of ordering from Sahchari Masale: seller details, GST and FSSAI licence, Cash on Delivery payment, delivery, replacement and governing law.',
    keywords: [
      'Sahchari Masale terms and conditions',
      'Sahchari Masale terms of sale',
      'Sahchari Masale seller details',
      'Sahchari Masale GST number',
      'Sahchari Masale FSSAI licence',
      'online spices store terms India',
      'cash on delivery terms',
      'Sahchari Masale order policy',
      'spices shop terms Mathura',
      'Sahchari Masale legal information',
    ],
  },
  privacy: {
    path: '/privacy',
    index: true,
    schemaType: 'WebPage',
    crumb: 'Privacy Policy',
    priority: 0.3,
    changeFrequency: 'yearly',
    title: 'Sahchari Masale Privacy Policy | Your Data, Your Rights',
    description:
      'How Sahchari Masale collects, uses and protects your data under the DPDP Act 2023. No ad tracking, data never sold, deletion on request.',
    keywords: [
      'Sahchari Masale privacy policy',
      'Sahchari Masale data protection',
      'DPDP Act 2023 online store privacy',
      'Sahchari Masale personal data',
      'Sahchari Masale cookie policy',
      'Sahchari Masale data deletion request',
      'online spices store privacy India',
      'Sahchari Masale customer data',
      'no ad tracking online store',
      'Sahchari Masale grievance contact',
    ],
  },
  refund: {
    path: '/refund',
    index: true,
    schemaType: 'WebPage',
    crumb: 'Replacement & Refund Policy',
    priority: 0.5,
    changeFrequency: 'yearly',
    title: 'Sahchari Masale Refund & Replacement Policy',
    description:
      'Wrong, damaged or short product? Sahchari Masale gives a free replacement or refund with your unboxing video. Report within 48 hours of delivery.',
    keywords: [
      'Sahchari Masale refund policy',
      'Sahchari Masale replacement policy',
      'Sahchari Masale return policy',
      'Sahchari Masale damaged product claim',
      'Sahchari Masale unboxing video',
      'Sahchari Masale wrong product received',
      'spices refund policy India',
      'Sahchari Masale refund time',
      'how to claim refund Sahchari Masale',
      'cash on delivery refund policy',
    ],
  },
  shipping: {
    path: '/shipping',
    index: true,
    schemaType: 'WebPage',
    crumb: 'Shipping & Delivery Policy',
    priority: 0.5,
    changeFrequency: 'yearly',
    title: 'Sahchari Masale Shipping & Delivery | Pan-India COD',
    description:
      'Pan-India shipping through trusted delivery partners, order tracking and Cash on Delivery. Read the Sahchari Masale delivery time and charges policy.',
    keywords: [
      'Sahchari Masale shipping policy',
      'Sahchari Masale delivery time',
      'Sahchari Masale delivery charges',
      'Sahchari Masale free delivery',
      'Sahchari Masale pan India delivery',
      'Sahchari Masale order tracking',
      'spices home delivery India',
      'cash on delivery spices India',
      'Sahchari Masale courier partner',
      'Sahchari Masale shipping Mathura',
    ],
  },
  'my-data': {
    path: '/my-data',
    index: false,
    crumb: 'My Data & Privacy Rights',
    title: 'Sahchari Masale My Data & Privacy Rights',
    description: 'See, download, withdraw or delete the data saved on this device and request access or deletion of your order records.',
    keywords: [
      'Sahchari Masale my data',
      'Sahchari Masale privacy rights',
      'Sahchari Masale delete my data',
      'Sahchari Masale download my data',
      'Sahchari Masale withdraw consent',
      'DPDP rights online store',
      'Sahchari Masale data request',
      'Sahchari Masale saved address',
      'Sahchari Masale cookie choices',
      'Sahchari Masale data access',
    ],
  },
};

/* Pages that belong in sitemap.xml (indexable, static). */
export const SITEMAP_PAGES = Object.keys(PAGES).filter((k) => PAGES[k].index);

/* ------------------------------------------------------------------ */
/* Metadata builders (Next.js Metadata objects)                       */
/* ------------------------------------------------------------------ */
export function socialMeta({ title, description, path, image, imageAlt }) {
  const img = image
    ? { url: image, alt: imageAlt || title }
    : { url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: OG_IMAGE.alt };
  return {
    openGraph: {
      type: 'website',
      url: path,
      siteName: BRAND.name,
      title,
      description,
      locale: 'en_IN',
      images: [img],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [img.url],
    },
  };
}

export function pageMetadata(key, overrides = {}) {
  const p = { ...PAGES[key], ...overrides };
  return {
    title: { absolute: p.title },
    description: p.description,
    keywords: p.keywords,
    alternates: {
      canonical: p.path,
      languages: { 'en-IN': p.path, 'x-default': p.path },
    },
    robots: p.index ? ROBOTS_INDEX : ROBOTS_NOINDEX,
    ...socialMeta({ title: p.title, description: p.description, path: p.path }),
  };
}

/* ------------------------------------------------------------------ */
/* Product helpers (shared by server metadata and client Router)      */
/* ------------------------------------------------------------------ */
export const productTitle = (name, brand = BRAND.name) => `Buy ${name} Online | ${brand}`;

export const clip = (s, n = 158) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-]+$/, '') + '…';
};

export function productKeywords(name, category, brand = BRAND.name) {
  const cat = category && category !== 'Other' ? category : 'spices';
  return [
    name,
    `${name} online`,
    `buy ${name}`,
    `${name} price`,
    `${brand} ${name}`,
    `${name} ${cat}`,
    `${cat} online India`,
    `${brand} ${cat}`,
    `${name} cash on delivery`,
    'authentic Indian masale',
  ];
}

export function productDescription(p, brand = BRAND.name) {
  const base = String(p.d || p.cap || '').replace(/\s+/g, ' ').trim();
  const tail = ` Buy online from ${brand}. Cash on Delivery across India.`;
  if (!base) return clip(`${p.n} - authentic Indian masale.${tail}`, 158);
  const budget = 158 - tail.length;
  let head = `${p.n}: ${base}`;
  if (head.length > budget) {
    const cut = head.slice(0, budget);
    const sp = cut.lastIndexOf(' ');
    head = (sp > budget * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-]+$/, '');
  }
  return head.replace(/[.!?]+$/, '') + '.' + tail;
}

/* ------------------------------------------------------------------ */
/* JSON-LD builders (all return plain objects)                        */
/* ------------------------------------------------------------------ */
export const ID = {
  org: () => `${SITE_URL}/#organization`,
  site: () => `${SITE_URL}/#website`,
};

const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

export function organizationNode(S = {}) {
  const wa = String(S.whatsapp || '').replace(/\D/g, '');
  const telephone = wa.length >= 10 ? '+' + wa : BRAND.phone;
  const email = S.email || BRAND.email;
  const sameAs = [S.instagram_url].filter(isHttp);
  return {
    '@type': 'Organization',
    '@id': ID.org(),
    name: BRAND.name,
    legalName: BRAND.legalName,
    alternateName: BRAND.alternateNames,
    url: SITE_URL + '/',
    logo: { '@type': 'ImageObject', '@id': `${SITE_URL}/#logo`, url: abs(LOGO_PATH), contentUrl: abs(LOGO_PATH), width: 256, height: 256, caption: BRAND.name },
    image: abs(OG_IMAGE.url),
    description: BRAND.description,
    slogan: BRAND.slogan,
    email,
    telephone,
    address: { '@type': 'PostalAddress', ...BRAND.address },
    areaServed: { '@type': 'Country', name: 'India' },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone,
        email,
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
    ],
    taxID: BRAND.gst,
    identifier: [{ '@type': 'PropertyValue', propertyID: 'FSSAI Licence Number', value: BRAND.fssai }],
    knowsAbout: ['Indian spices', 'Masale', 'Spice powders', 'Garam masala', 'Cash on delivery spice shopping'],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': ID.site(),
    url: SITE_URL + '/',
    name: BRAND.name,
    alternateName: ['Sahchari Masala', 'sahcharimasale.in'],
    description: BRAND.description,
    inLanguage: 'en-IN',
    publisher: { '@id': ID.org() },
  };
}

export function breadcrumbNode(key, extraCrumbs = []) {
  const p = PAGES[key];
  const items = [{ name: 'Home', path: '/' }];
  if (key !== 'home') items.push({ name: p.crumb, path: p.path });
  extraCrumbs.forEach((c) => items.push(c));
  const last = items[items.length - 1];
  return {
    '@type': 'BreadcrumbList',
    '@id': `${abs(last.path)}#breadcrumb`,
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

export function webPageNode(key, { path, name, description, type, extra = {} } = {}) {
  const p = PAGES[key];
  const pagePath = path || p.path;
  const url = abs(pagePath);
  return {
    '@type': type || p.schemaType || 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: name || p.title,
    description: description || p.description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': ID.site() },
    about: { '@id': ID.org() },
    publisher: { '@id': ID.org() },
    primaryImageOfPage: { '@type': 'ImageObject', url: abs(OG_IMAGE.url), width: OG_IMAGE.width, height: OG_IMAGE.height },
    breadcrumb: { '@id': `${url}#breadcrumb` },
    ...extra,
  };
}

export function navigationNode() {
  return {
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#site-navigation`,
    name: `${BRAND.name} main navigation`,
    itemListElement: NAV_PAGES.map(([k, label], i) => ({
      '@type': 'SiteNavigationElement',
      position: i + 1,
      name: label,
      description: PAGES[k].description,
      url: k === 'home' ? SITE_URL + '/' : abs(PAGES[k].path),
    })),
  };
}

export const graph = (nodes) => ({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) });

/* Compact helper: price in rupees -> display string for text (llms.txt, FAQ) */
export const rupees = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
