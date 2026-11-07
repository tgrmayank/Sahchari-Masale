import { Baloo_2, Poppins } from 'next/font/google';
import { SITE_URL, BRAND, PAGES, ROBOTS_INDEX, socialMeta } from '@/lib/seo';

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
});

/* Optional: set these in .env / Vercel to verify the site in Search Console / Bing Webmaster */
const GOOGLE_VERIFY = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'RTChC2HS183jngx340dcb9l_U0VM2xsu3IRQt2GU8ic';
const BING_VERIFY = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '';

const verification = {};
if (GOOGLE_VERIFY) verification.google = GOOGLE_VERIFY;
if (BING_VERIFY) verification.other = { 'msvalidate.01': BING_VERIFY };

/* Origin of the Supabase API - the shop loads its catalog from here, so warm up the connection early. */
let supabaseOrigin = '';
try {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (u && !/YOUR-PROJECT/i.test(u)) supabaseOrigin = new URL(u).origin;
} catch {}

const home = PAGES.home;

/* Site-wide defaults. Every page overrides title / description / canonical / social in its own page.jsx. */
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: home.title, template: `%s | ${BRAND.name}` },
  description: home.description,
  applicationName: BRAND.name,
  keywords: home.keywords,
  authors: [{ name: BRAND.name, url: SITE_URL }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: 'Food & Grocery',
  referrer: 'origin-when-cross-origin',
  robots: ROBOTS_INDEX,
  ...socialMeta({ title: home.title, description: home.description, path: '/' }),
  ...(Object.keys(verification).length ? { verification } : {}),
  other: {
    // Geo / local targeting (Mathura, Uttar Pradesh, India)
    'geo.region': BRAND.geo.region,
    'geo.placename': BRAND.geo.placename,
    'geo.position': `${BRAND.geo.lat};${BRAND.geo.lng}`,
    ICBM: `${BRAND.geo.lat}, ${BRAND.geo.lng}`,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND.themeColor,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={`${baloo.variable} ${poppins.variable}`} data-scroll-behavior="smooth">
      {supabaseOrigin ? (
        <head>
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
          <link rel="dns-prefetch" href={supabaseOrigin} />
        </head>
      ) : null}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
