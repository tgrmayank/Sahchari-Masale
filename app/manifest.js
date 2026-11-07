import { BRAND } from '@/lib/seo';

export default function manifest() {
  return {
    name: 'Sahchari Masale - Pure Indian Spices',
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fff4dc',
    theme_color: BRAND.themeColor,
    lang: 'en-IN',
    dir: 'ltr',
    categories: ['food', 'shopping'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
