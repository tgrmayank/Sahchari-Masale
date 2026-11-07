import { Router } from '../Site';
import JsonLd from '@/lib/JsonLd';
import { pageMetadata, abs } from '@/lib/seo';
import { homeSchema, getProducts, getHeroImage } from '@/lib/seo-server';

export const metadata = pageMetadata('home');

export default async function Page() {
  const [schema, products, heroImg] = await Promise.all([homeSchema(), getProducts(), getHeroImage()]);
  return (
    <>
      {heroImg ? <link rel="preload" as="image" href={heroImg} fetchPriority="high" /> : null}
      <JsonLd data={schema} />
      <Router />
      {/* Crawlable links for visitors / bots without JavaScript. Invisible when JS is on. */}
      <noscript>
        <nav aria-label="Sahchari Masale">
          <h1>Sahchari Masale - Pure Indian Spices</h1>
          <p>Buy authentic Indian spices (masale) online from Sahchari Masale, Mathura. FSSAI licensed. Cash on Delivery across India.</p>
          <ul>
            {products.slice(0, 100).map((p) => (
              <li key={p.id}><a href={abs(`/product/${p.id}`)}>{p.n}</a></li>
            ))}
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/shipping">Shipping &amp; Delivery Policy</a></li>
            <li><a href="/refund">Replacement &amp; Refund Policy</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms &amp; Conditions</a></li>
          </ul>
        </nav>
      </noscript>
    </>
  );
}
