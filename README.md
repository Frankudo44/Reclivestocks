# REC Livestock & Agro Farms Enterprises

**Growing Excellence, Feeding the Future.**

Production website for REC Livestock & Agro Farms Enterprises — a Nigerian livestock
and agro marketplace in lagos State. Fresh farm produce, livestock, eggs, fish,
supplies — all sourced with integrity and delivered cold & fresh.

- Live config-driven storefront (vanilla HTML/CSS/JS + Supabase)
- Full admin panel for products, orders, inventory, reviews, blog and more
- Ready for Vercel deployment with zero build step

---

## Features

- **Storefront** — homepage, shop with filters & search, product details, cart, checkout, order tracking
- **Policy support** — certain items (e.g. broiler meat, pigs) are marked *“Visit Farm to Purchase”* and cannot be ordered online
- **Supabase data layer** — all catalogue, settings, blog and review content is read live from Supabase (Row-Level Security enforced)
- **Graceful demo fallback** — before Supabase keys are added, the site runs on sample demo data so you can still explore the UI
- **Auth** — customer sign up/sign in via Supabase Auth; `profiles.role = 'admin'` unlocks the admin panel
- **Admin panel** — `/admin` with dashboard KPIs, order status workflow, product CRUD + image upload, inventory, categories, delivery zones, testimonials, product review moderation, blog, contact inbox, customers, site settings
- **Product reviews** — signed-in customers rate and comment on each item; reviews go live only after an admin approves them (approve / hide / feature / delete)
- **Delivery zones** — fee + minimum order per zone drives a structured checkout tax
- **WhatsApp-first support** — one-click WhatsApp chat replaces a JS map, meeting the “no JS map library” requirement
- **SEO / polish** — semantic markup, OG tags, robots.txt, sitemap.xml, custom 404, SVG favicon & logo
- **Catching invite**: design boards, receiving + sizing areas, AI cohort recommendations (see roadmap)

---

## Tech Stack

| Layer     | Choice                                                        |
|-----------|---------------------------------------------------------------|
| Frontend  | Vanilla HTML5, CSS3, Vanilla JavaScript (no frameworks)       |
| Backend   | Supabase (PostgreSQL, Auth, Storage, Row-Level Security)      |
| Hosting   | Vercel (static, zero config)                                  |
| Fonts     | Fraunces (display) + Manrope (UI), via Google Fonts           |

---

## Project Structure

```
├── index.html                 # Homepage
├── shop.html                  # Shop / marketplace listing
├── product.html               # Product detail
├── cart.html / checkout.html  # Cart + checkout flow
├── order-success.html         # Order confirmation + tracking
├── account.html               # Auth + order history
├── about.html / contact.html  # Farm story + contact/map+WhatsApp
├── blog.html / blog-post.html # Learning hub
├── privacy.html / terms.html / 404.html
├── admin/                     # Admin area (requires admin role)
│   ├── login.html / index.html
│   ├── products.html / orders.html / inventory.html
│   ├── categories.html / delivery.html / testimonials.html
│   ├── reviews.html / blog.html / messages.html / customers.html / settings.html
├── css/                       # variables, global, components, layout,
│                              # responsive, shop, admin
├── js/                        # config, supabase, ui, products, cart,
│                              # render, auth, orders, whatsapp, navigation,
│                              # footer + page controllers + admin controllers
├── assets/
│   ├── logo/                  # rec-logo.jpg (main logo / favicon)
│   ├── icons/                 # svg sprite (sprite.svg)
│   └── images/                # placeholder SVGs (hero, categories, product…)
├── supabase/
│   ├── schema.sql             # Full schema + RLS + triggers + storage
│   └── seed.sql               # Sample categories, products, settings, zones…
├── api/                       # Vercel serverless functions
│   ├── verify-payment.js      # Paystack webhook verification
│   └── sitemap.js             # Dynamic sitemap.xml
└── vercel.json / robots.txt / sitemap.xml / .env.example / .gitignore
```

---

## Quick Start

```bash
# serve statically (any static server is fine):
python -m http.server 8080
# or
npx serve .
```

Open http://localhost:8080 — the site runs immediately using demo data.

---

## Connect Supabase

> The frontend uses only the **anon key** with Row-Level Security protecting every
> table. Never put your service-role key in browser code.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/schema.sql` (tables, indexes, RLS,
   triggers, storage bucket `rec-media`).
3. Optional: run `supabase/seed.sql` to load sample products, categories, zones,
   a site-settings row and sample blog posts/testimonials. Delete sample rows
   before going live.
4. The site reads its keys directly from `js/config.js` — the Supabase URL and
   **anon** key are committed there on purpose. The anon key is public by design
   and safe to ship to the browser; RLS protects every table.

```js
// js/config.js
supabaseUrl: "https://<project>.supabase.co",
supabaseAnonKey: "your-anon-key",
```

> These client values are **not** read from Vercel environment variables — the
> site is fully static with no build step, so anything the browser needs must be
> in `config.js`. Env vars are only used by the serverless functions in `api/`
> (Paystack verification), which run on the server.

### Create your admin user

1. In Supabase **Authentication → Users**, add the email you will use.
2. In **SQL Editor**, run:

```sql
update public.profiles
set full_name = 'Farm Admin', role = 'admin'
where email = 'you@example.com';
```

> The admin email must exactly match the authenticated user's email.
> `handle_new_user()` auto-creates the profile row when the account signs in.

3. Sign in at `https://<your-site>/admin/login.html` — done.

### Storage (product/blog images)

`rec-media` is created by `schema.sql` with **public read** and **write restricted
to admins**. When you upload images in the admin panel they are stored there;
customer/anon access is read-only thanks to storage RLS.

---

## Orders & Checkout

- Orders go into `public.orders`; the database trigger `assign_order_number` assigns
  references like `REC-2026-000001`.
- Items are stored as JSON (`items`), and a second trigger `sync_order_items`
  normalizes them into `order_items`.
- Fulfilment statuses: `pending → confirmed → processing → ready →
  out for delivery → completed` (or `cancelled`). Guests track orders on
  `order-success.html` via the `track_order(p_reference)` RPC — no sensitive data exposed.

---

## Deployment (Vercel)

The project is fully static — no build step.

1. Push to GitHub, then **Import Project → Vercel** and choose the repo.
2. Framework preset: **Other**. Output directory: leave as project root.
3. The storefront needs no env vars — Supabase URL + anon key already live in
   `js/config.js`. Only the serverless payment route needs secrets, and only if
   you enable Paystack checkout:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PAYSTACK_SECRET_KEY`
4. Attach your custom domain (`reclivestock.com`), add the 
   `robots.txt`/`sitemap.xml` and you're live.

`vercel.json` enables clean URLs and long-lived cache headers for hashed
assets/images.

---

## Security Notes

- RLS is enabled on every table; anonymous access is limited to the exact
  `SELECT` needed by the storefront.
- Only `profiles.role = 'admin'` (enforced by `is_admin()`) can insert/update/delete
  products, orders, settings, etc.
- `track_order` returns only order status/eta fields to guests.
- The admin account is created inside your own Supabase — no shared credentials.

---

## Roadmap

- Store pickup scheduling & branch pickup alerts
- Bulk/B2B order flow & custom quotations
- Weather-based delivery advisories
- AI cohort recommendations (safe, privacy-preserving)
- Optional: ad skip / premium content upgrades
- On-farm tour bookings

---

## License

Proprietary — all rights reserved. Content, design and assets belong to
REC Livestock & Agro Farms Enterprises unless otherwise noted.