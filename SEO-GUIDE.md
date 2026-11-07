# Sahchari Masale - SEO / AEO / GEO setup

Is project me website ka koi design ya content change nahi kiya gaya. Sirf SEO ka technical layer add hua hai.

## Kya add hua hai

| Cheez | Kahan | Kya karta hai |
|---|---|---|
| Title, description, 10 keywords, canonical, Open Graph, Twitter card | `lib/seo.js` + har `app/(site)/*/page.jsx` | Har page ka apna SEO (brand name "Sahchari Masale" har title me) |
| Product pages ka SEO | `app/(site)/product/page.jsx` + `middleware.js` | `/product/3` ka title, description, canonical, OG image aur Product schema shop ke data se khud banta hai |
| JSON-LD schema | `lib/seo.js`, `lib/seo-server.js` | Organization, WebSite, WebPage, BreadcrumbList, ItemList (home), Product + Offer + Rating (products), FAQPage (shipping, refund), ContactPage |
| robots.txt | `app/robots.js` | Google, Bing aur AI bots (ChatGPT, Perplexity, Claude, Gemini) allowed. Sirf `/admin` blocked |
| sitemap.xml | `app/sitemap.js` | Public pages + saare active products (admin me product add/hide karo to khud update hota hai) |
| llms.txt | `app/llms.txt/route.js` | AI answer engines ke liye brand + products ka summary (GEO / AEO) |
| Private pages noindex | meta tag + `X-Robots-Tag` (`next.config.mjs`) | cart, address, payment, orders, track, order-success, my-data, admin Google me nahi aayenge |
| 404 page | `app/not-found.jsx` | noindex |
| Geo tags | `app/layout.jsx` | Mathura, Uttar Pradesh (IN-UP) |
| Manifest, icons, OG image | `app/manifest.js`, `public/` | Brand logo / share image 1200x630 |
| Language | `app/layout.jsx` | `lang="en-IN"` |

## Deploy ke baad ye karo (zaroori)

1. `.env` / Vercel Environment Variables me `NEXT_PUBLIC_SITE_URL=https://sahcharimasale.in` daalo (apna final domain, bina `/` ke).
2. **Google Search Console** (search.google.com/search-console) -> Add property -> *URL prefix* -> `https://sahcharimasale.in`.
   - Verify karne ke liye "HTML tag" choose karo, `content="..."` wali value copy karo, aur `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` me paste karke redeploy karo. Phir Verify dabao.
3. Sitemaps -> `sitemap.xml` submit karo.
4. URL Inspection me `https://sahcharimasale.in/` daalo -> **Request indexing**. Aise hi 2-3 main products ke liye bhi.
5. Browser me ye URLs khol ke check karo: `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/manifest.webmanifest`.
6. Rich Results Test (search.google.com/test/rich-results) me home aur ek product URL daalo, schema check karo.
7. Domain ka ek hi version rakho (`sahcharimasale.in` ya `www.`) aur doosre ko hosting ke domain settings me 301 redirect kar do.

## Brand search ("Sahchari Masale") me upar aane ke liye

Technical setup sirf neev hai. Google ranking guarantee koi nahi de sakta. Asli asar in cheezon se aata hai:

- **Google Business Profile** banao (Mat, Mathura address, phone, website). Brand search me ye sabse bada boost deta hai.
- Admin -> *Store & Contact* me **Instagram link** daalo. Ye schema me `sameAs` ban jata hai.
- Instagram / Facebook / WhatsApp Business bio me website link aur wahi naam "Sahchari Masale" use karo.
- Har product me achhi photo, caption aur description likho (admin se). Description jitni unique hogi, utna achha.
- Customers se reviews lo (admin me reviews approve karo). Rating schema sirf asli reviews se banta hai.
- Naam, address aur phone har jagah same likho.

## Dhyan rakhne wali baat

- Shop ka content browser me JavaScript se load hota hai (Supabase se). Google ye render kar leta hai, par pehli baar index hone me kuch din lag sakte hain. Isi liye sitemap, JSON-LD aur noscript links diye gaye hain.
- Geo meta tags me coordinates Mathura district ke andaze se hain (`lib/seo.js` -> `BRAND.geo`). Exact location chahiye ho to wahan badal do.
- Brand ka naam, phone, email, GST, FSSAI sab `lib/seo.js` ke `BRAND` me hai. Kuch badle to bas wahin badalna hai.
- Agar AI training bots (GPTBot, Google-Extended) ko block karna ho to `app/robots.js` se unka naam hata do.
