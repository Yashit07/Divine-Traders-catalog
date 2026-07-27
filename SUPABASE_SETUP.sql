-- =============================================
-- Divine Traders — Supabase Setup Script
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name text not null,
  category text not null,
  description text,
  packaging text,
  price numeric,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Variants table
create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists variants_product_id_idx on public.variants(product_id);

-- 3. Branding (single-row settings)
create table if not exists public.branding (
  id uuid primary key default gen_random_uuid(),
  business_name text default 'Divine Traders',
  emblem text default 'DT',
  tagline text default 'We Deals in Wholesale — Cosmetics, FMCG & General Products',
  sub_tagline text default 'Your Trust, Our Quality',
  phone1 text default '+91 7529078910',
  phone2 text default '+91 9814523366',
  address text default 'SCO No. 85, 1st Floor, Panchkula Shopping Complex, Peer Muchalla',
  admin_password text default 'admin@divine',
  updated_at timestamptz default now()
);

-- 4. Enable RLS with permissive policies (internal catalog, single shared admin password)
alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.branding enable row level security;

drop policy if exists "anon all products" on public.products;
create policy "anon all products" on public.products for all to anon using (true) with check (true);

drop policy if exists "anon all variants" on public.variants;
create policy "anon all variants" on public.variants for all to anon using (true) with check (true);

drop policy if exists "anon all branding" on public.branding;
create policy "anon all branding" on public.branding for all to anon using (true) with check (true);

-- 5. Storage bucket for product images
-- IMPORTANT: Also do this in Dashboard → Storage:
--   a) Create a bucket named exactly:  product-images
--   b) Toggle "Public bucket" ON so images render directly.
--
-- The SQL below sets permissive policies for the anon role
-- so the browser can upload without signing in.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "anon read product-images" on storage.objects;
create policy "anon read product-images" on storage.objects
  for select to anon using (bucket_id = 'product-images');

drop policy if exists "anon write product-images" on storage.objects;
create policy "anon write product-images" on storage.objects
  for insert to anon with check (bucket_id = 'product-images');

drop policy if exists "anon update product-images" on storage.objects;
create policy "anon update product-images" on storage.objects
  for update to anon using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

drop policy if exists "anon delete product-images" on storage.objects;
create policy "anon delete product-images" on storage.objects
  for delete to anon using (bucket_id = 'product-images');

-- Done! Reload the app and it will auto-seed 125 products on first load.
