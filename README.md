# Sahchari Masale - Next.js + Supabase + Admin Panel

The storefront and the Admin Panel are both built with **Next.js**. **Supabase** provides the
database, admin login and image storage. Everything on the website is controlled from the admin panel.

```
sahchari-masale/
|- .env                  <- your Supabase keys (same folder as package.json)
|- .env.example          (reference copy)
|- supabase-schema.sql   <- run once in the Supabase SQL Editor
|- lib/                  (Supabase connection, image upload)
`- app/
   |- (site)/            storefront            -> /
   `- admin/             admin panel           -> /admin (login at /admin/login)
```

## One-time setup

1. **Create a project** at supabase.com.
2. **Create `.env`** in the project root with the two values from *Project Settings -> API*:
   `NEXT_PUBLIC_SUPABASE_URL` (Project URL) and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public key).
   Never use the `service_role` key.
3. **Run the SQL.** Open `supabase-schema.sql`, replace `your-email@example.com` with your admin email,
   then paste the whole file into *SQL Editor -> New query* and press **Run**. This creates the tables,
   security rules, order functions and the `media` image bucket. No demo data is added.
4. **Create the admin user.** *Authentication -> Users -> Add user -> Create new user* with the same email,
   a password, and **Auto Confirm User** ticked. Then switch **Allow new users to sign up** OFF.
5. **Run it:** `npm install` then `npm run dev`. Storefront: http://localhost:3000 - Admin: http://localhost:3000/admin/login

## What the admin panel controls

| Section | What you can do |
|---|---|
| Dashboard | Today's orders and sales, 7-day chart, items that need attention |
| Orders | Search, filter by status, update status, private note, WhatsApp / call / copy address, delete |
| Products | Add, edit, duplicate, hide, mark sold out, delete. Pick a category. Upload up to 8 photos or paste image links, reorder them. Add or remove any number of packs, each with its own price and MRP. Export / Import JSON |
| Categories | Add, rename, replace icon and banner images, reorder, show / hide, delete |
| Home Banners | Add as many slider banners as you want (upload or image link), link each to a category, reorder, show / hide |
| Coupons | Percent, flat or free delivery; minimum order; category; expiry; public or hidden code |
| Reviews | Approve / hide, delete, add a review |
| Delivery Charges | Delivery fee, free-delivery limit, delivery time text |
| Store & Contact | Logo, name, tagline, phone, WhatsApp, email, Instagram, map, address |
| Homepage Text | Scrolling top bar, highlights, "Why choose us" |
| Terms & Privacy | Full text editor |

All images are stored in Supabase Storage. The site shows photos only; there are no emojis on products.

## Product JSON format

Use **Products -> Export JSON** to back up, and **Import JSON** to add many products at once
(sample below). Each product looks like this:

```json
{
  "name": "Turmeric Powder",
  "category": "Ground Spices",
  "caption": "Golden colour, pure aroma",
  "description": "Stone-ground turmeric.",
  "ingredients": "Turmeric 100%",
  "tag": "Bestseller",
  "tag_color": "#d9a21b",
  "images": ["https://.../photo-1.webp", "https://.../photo-2.webp"],
  "packs": [
    { "label": "100 g", "price": 45, "mrp": 55 },
    { "label": "500 g", "price": 200, "mrp": 250 }
  ],
  "in_stock": true,
  "is_active": true,
  "sort_order": 10
}
```

Rules: `name` is required; at least one pack with a `label` and `price` above 0; `mrp` is optional;
`category` must match an existing category name (otherwise the product has no category); up to 8 image links.
Import always adds new products, it never overwrites existing ones.

## Deploy on Vercel

1. Upload the project to a GitHub repository (`package.json` must be at the top level of the repo).
   Do not upload `node_modules`, `.next` or `.env`.
2. On vercel.com choose **Add New -> Project**, import the repository, and keep the Next.js defaults.
3. Before pressing Deploy, open **Environment Variables** and add exactly these two:

| Name | Value | Where to find it in Supabase |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Project Settings -> API -> Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | long key starting with `eyJ...` (or `sb_publishable_...`) | Project Settings -> API -> anon / publishable key |

4. Press **Deploy**. Your site is `https://your-project.vercel.app` and the admin is `/admin/login`.
5. In Supabase open **Authentication -> URL Configuration** and set **Site URL** to your Vercel URL.
6. Changed a variable later? Redeploy from the Vercel dashboard so it takes effect.

There is no other API to set up. The website talks to Supabase directly with the URL and the anon key,
and Row Level Security in `supabase-schema.sql` protects your data. Never put the `service_role` key anywhere.

## Security

- Prices, delivery charge and coupons are recalculated on the server (Supabase functions) for every order.
- Orders can only be read with their secret Order ID. Everything else is visible to the admin only.
- Forgot your password? *Supabase -> Authentication -> Users* -> reset the password.
