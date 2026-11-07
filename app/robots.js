import { SITE_URL } from '@/lib/seo';

/*
 * robots.txt  ->  https://sahcharimasale.in/robots.txt
 * - Search engines and AI answer engines (ChatGPT, Perplexity, Claude, Gemini,
 *   Apple, Bing) may crawl the public shop.
 * - Only the admin panel is blocked. Private customer pages (cart, checkout,
 *   orders, track...) are kept out of Google with a noindex tag instead, so
 *   Google can actually see that tag.
 * - /_next/ is NOT blocked: Google needs the JS/CSS to render the shop.
 */
const PRIVATE = ['/admin', '/admin/'];

const AI_AND_SEARCH_BOTS = [
  'Googlebot', 'Googlebot-Image', 'Bingbot', 'Applebot', 'DuckDuckBot',
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'PerplexityBot', 'Perplexity-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'meta-externalagent',
];

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_AND_SEARCH_BOTS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
