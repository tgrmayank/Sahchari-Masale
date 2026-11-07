import { SITE_URL, PAGES, SITEMAP_PAGES, abs } from '@/lib/seo';
import { getProducts } from '@/lib/seo-server';

/*
 * sitemap.xml  ->  https://sahcharimasale.in/sitemap.xml
 * Static public pages + every active product from the shop (auto-updates
 * when you add / hide products in the admin panel, refreshed hourly).
 * Private pages (cart, checkout, orders, track, my-data, admin) are excluded.
 */
export const revalidate = 3600;

export default async function sitemap() {
  const pages = SITEMAP_PAGES.map((k) => ({
    url: k === 'home' ? SITE_URL + '/' : abs(PAGES[k].path),
    changeFrequency: PAGES[k].changeFrequency,
    priority: PAGES[k].priority,
  }));

  let products = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  const productUrls = products.map((p) => ({
    url: abs(`/product/${encodeURIComponent(p.id)}`),
    changeFrequency: 'weekly',
    priority: 0.8,
    ...(p.imgs && p.imgs.length ? { images: p.imgs.slice(0, 3) } : {}),
  }));

  return [...pages, ...productUrls];
}
