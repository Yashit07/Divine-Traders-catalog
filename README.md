# 💗 Divine Traders — Wholesale Catalog

Fresh, cute, minimal wholesale catalog for **Divine Traders**. Built with React + Vite + Tailwind, backed by **Supabase** (Database + Storage), deployable to **Vercel** in one click.

## 🚀 One-time setup

1. Open your Supabase project → **SQL Editor** → paste the contents of `SUPABASE_SETUP.sql` → Run.
2. In **Storage**, confirm the bucket **`product-images`** was created and is **public**.
3. Reload the app — it will auto-seed 125 products on first load.

## 🔐 Admin

- Floating button (bottom-right) opens the Unlock modal with two options:
  - **Show Prices** — toggles wholesale prices for buyers.
  - **Edit Mode** — password protected. Default password: **`admin@divine`** (change it via Branding editor).

## 🏷️ Categories

Fragrances • Base & Complexion • Eyes & Palettes • Lip Products • Skincare • Facial Kits • Hair Care • Accessories

## 🌐 Deploy to Vercel

Push this repo to GitHub and “Import Project” in Vercel. Set env vars:

```
VITE_SUPABASE_URL=<your supabase url>
VITE_SUPABASE_ANON_KEY=<your anon key>
```

Build command: `yarn build` • Output dir: `build`
