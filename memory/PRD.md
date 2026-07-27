# Divine Traders — Wholesale Catalog (PRD)

## What was built

- Fresh React (Vite) + Tailwind app with a blush-gold pastel gradient / glassmorphism design.
- Supabase (Database + Storage) as the sole backend — no server code needed. Vercel-ready.
- Floating unlock modal with two flows: (a) Show/Hide prices, (b) Password-protected Edit Mode.
- Product CRUD, dynamic variant system (variant pills swap image + price live), image upload to Supabase Storage bucket `product-images`.
- 125 seed products auto-inserted on first load; branding row auto-created with real store details.
- Editable branding (name, emblem, taglines, phones, address, admin password).
- Export catalog as JSON; Reset catalog back to seed.

## Stack

- Frontend: React 18 + Vite 5 + Tailwind 3 + `@supabase/supabase-js` 2.45
- Backend: none (Supabase directly). A minimal FastAPI stub exists just to keep supervisor happy in the Emergent preview.

## One-time setup performed by user

1. Paste `SUPABASE_SETUP.sql` into Supabase SQL editor (creates 3 tables, RLS policies, `product-images` storage bucket + policies).
2. Confirm `product-images` bucket is public in Storage UI.

## Files

- `/app/frontend/*` — Vite React app.
- `/app/SUPABASE_SETUP.sql` — one-shot schema+storage script.
- `/app/backend/*` — stub only.
