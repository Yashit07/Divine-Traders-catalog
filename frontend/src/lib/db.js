import { supabase, STORAGE_BUCKET } from './supabase'
import { SEED_PRODUCTS, DEFAULT_BRANDING } from './seed'

// ---- Products ----
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, variants(*)')
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data || []).map((p) => ({
    ...p,

    /*
     * Make sure image_urls is always an array.
     *
     * Old products may only have image_url.
     */
    image_urls: Array.isArray(p.image_urls)
      ? p.image_urls.filter(Boolean)
      : (p.image_url ? [p.image_url] : []),

    variants: (p.variants || []).sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    ),
  }))
}

export async function insertProduct(product) {
  const { variants, ...base } = product
  const { data, error } = await supabase.from('products').insert(base).select().single()
  if (error) throw error
  if (variants && variants.length) {
    const rows = variants.map((v, i) => ({ ...v, product_id: data.id, sort_order: i }))
    const { error: vErr } = await supabase.from('variants').insert(rows)
    if (vErr) throw vErr
  }
  return data
}

export async function updateProduct(id, patch) {
  const { variants, ...base } = patch
  const { error } = await supabase.from('products').update(base).eq('id', id)
  if (error) throw error
  if (Array.isArray(variants)) {
    // Replace variants: delete existing then insert new
    const { error: delErr } = await supabase.from('variants').delete().eq('product_id', id)
    if (delErr) throw delErr
    if (variants.length) {
      const rows = variants.map((v, i) => {
        const { id: _drop, ...clean } = v
        return { ...clean, product_id: id, sort_order: i }
      })
      const { error: insErr } = await supabase.from('variants').insert(rows)
      if (insErr) throw insErr
    }
  }
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ---- Branding ----
export async function fetchBranding() {
  const { data, error } = await supabase.from('branding').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function upsertBranding(patch) {
  const existing = await fetchBranding()
  if (existing) {
    const { error } = await supabase.from('branding').update(patch).eq('id', existing.id)
    if (error) throw error
    return { ...existing, ...patch }
  }
  const { data, error } = await supabase.from('branding').insert({ ...DEFAULT_BRANDING, ...patch }).select().single()
  if (error) throw error
  return data
}

// ---- Storage ----
export async function uploadImage(file, prefix = 'product') {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type,
  })
  if (error) throw error
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ---- One-time seeding (guarded against React StrictMode double-invocation) ----
let __seedPromise = null
export function _resetSeedGuard() { __seedPromise = null }

export async function ensureSeeded() {
  if (__seedPromise) return __seedPromise
  __seedPromise = (async () => {
    // Re-check count inside the lock in case another tab / render already seeded
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true })
    if (error) throw error
    if ((count || 0) > 0) return { seeded: false, count }
    // Bulk insert products (no variants). Chunk to be safe.
    const chunkSize = 50
    for (let i = 0; i < SEED_PRODUCTS.length; i += chunkSize) {
      const chunk = SEED_PRODUCTS.slice(i, i + chunkSize)
      const { error: insErr } = await supabase.from('products').insert(chunk)
      if (insErr) throw insErr
    }
    // Ensure branding row exists
    const existing = await fetchBranding()
    if (!existing) {
      const { error: bErr } = await supabase.from('branding').insert(DEFAULT_BRANDING)
      if (bErr) throw bErr
    }
    return { seeded: true, count: SEED_PRODUCTS.length }
  })().catch((err) => {
    // Clear the lock on failure so a manual retry can try again cleanly
    __seedPromise = null
    throw err
  })
  return __seedPromise
}

export async function resetCatalog() {
  // Delete all products (cascade deletes variants)
  const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
  _resetSeedGuard()
  await ensureSeeded()
}

// ---- Shared Catalogs ----

export async function createSharedCatalog(products) {
  const snapshot = products.map((p) => ({
    id: p.id,
    brand: p.brand || '',
    name: p.name || '',
    category: p.category || '',
    description: p.description || '',
    packaging: p.packaging || '',
    price: p.price ?? null,
    image_url: p.image_url || null,
    image_urls: Array.isArray(p.image_urls)
      ? p.image_urls.filter(Boolean)
      : (p.image_url ? [p.image_url] : []),
    variants: Array.isArray(p.variants)
      ? p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price ?? null,
          image_url: v.image_url || null,
          sort_order: v.sort_order ?? 0,
        }))
      : [],
  }))

  const { data, error } = await supabase
    .from('shared_catalogs')
    .insert({
      products: snapshot,
    })
    .select('id')
    .single()

  if (error) throw error

  return data.id
}

export async function fetchSharedCatalog(id) {
  const { data, error } = await supabase
    .from('shared_catalogs')
    .select('products')
    .eq('id', id)
    .single()

  if (error) throw error

  return Array.isArray(data?.products)
    ? data.products
    : []
}

export function exportJson(products, branding) {
  return JSON.stringify({ exported_at: new Date().toISOString(), branding, products }, null, 2)
}
