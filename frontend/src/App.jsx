import React, { useEffect, useMemo, useRef, useState } from 'react'
import BusinessCard from './components/BusinessCard'
import CategoryTabs from './components/CategoryTabs'
import ProductCard from './components/ProductCard'
import UnlockModal from './components/UnlockModal'
import ProductEditor from './components/ProductEditor'
import BrandingEditor from './components/BrandingEditor'
import AdminBar from './components/AdminBar'
import SetupScreen from './components/SetupScreen'
import ToastStack from './components/Toast'
import WishlistDrawer from './components/WishlistDrawer'
import SharedCatalog from './components/SharedCatalog'

import {
  fetchProducts,
  insertProduct,
  updateProduct,
  deleteProduct,
  fetchBranding,
  upsertBranding,
  ensureSeeded,
  resetCatalog,
  exportJson,
  fetchSharedCatalog,
} from './lib/db'

import { SUPABASE_READY } from './lib/supabase'
import { DEFAULT_BRANDING } from './lib/seed'
import { toast } from './lib/toast'

const LS_KEYS = {
  showPrices: 'dt_show_prices',
  editMode:   'dt_edit_mode',
  wishlist:   'dt_wishlist_v1',
}

function lsGet(k, def) {
  try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v) } catch { return def }
}
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

function ProgressiveProductGrid({
  products,
  showPrices,
  editMode,
  wishlistSet,
  onEdit,
  onDelete,
  onToggleWishlist,
}) {
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => {
    setVisibleCount(12)
  }, [products])

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight +
          window.scrollY >=
        document.documentElement.scrollHeight - 900
      ) {
        setVisibleCount(current =>
          Math.min(
            current + 12,
            products.length
          )
        )
      }
    }

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    )

    return () =>
      window.removeEventListener(
        'scroll',
        handleScroll
      )
  }, [products.length])

  const visibleProducts =
    products.slice(0, visibleCount)

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {visibleProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            showPrices={showPrices}
            editMode={editMode}
            onEdit={onEdit}
            onDelete={onDelete}
            inWishlist={wishlistSet.has(product.id)}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
      </div>

      {visibleCount < products.length && (
        <div className="flex justify-center py-8">
          <div className="catalog-loading-spinner">
            <div className="catalog-spinner-ring" />
            <span>Loading more products…</span>
          </div>
        </div>
      )}
    </>
  )
}
export default function App() {
  const [products, setProducts] = useState([])
  const [branding, setBranding] = useState(DEFAULT_BRANDING)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [needsSetup, setNeedsSetup] = useState(false)

  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')

  // Persisted admin/buyer state
  const [showPrices, setShowPrices] = useState(() => lsGet(LS_KEYS.showPrices, false))
  const [editMode, setEditMode] = useState(() => lsGet(LS_KEYS.editMode, false))
  const [wishlist, setWishlist] = useState(() => lsGet(LS_KEYS.wishlist, [])) // array of product IDs

  const [unlockOpen, setUnlockOpen] = useState(false)
const [editorOpen, setEditorOpen] = useState(false)
const [brandingOpen, setBrandingOpen] = useState(false)
const [wishlistOpen, setWishlistOpen] = useState(false)
const [sharedCatalog, setSharedCatalog] = useState(null)
const [sharedCatalogLoading, setSharedCatalogLoading] = useState(false)
const [editing, setEditing] = useState(null)

const catalogRef = useRef(null)

  // Persist state
  useEffect(() => { lsSet(LS_KEYS.showPrices, showPrices) }, [showPrices])
  useEffect(() => { lsSet(LS_KEYS.editMode, editMode) }, [editMode])
  useEffect(() => { lsSet(LS_KEYS.wishlist, wishlist) }, [wishlist])

  async function loadAll() {
    setLoading(true); setLoadError(''); setNeedsSetup(false)
    try {
      if (!SUPABASE_READY) throw new Error('Supabase env vars missing')
      const seedResult = await ensureSeeded()
      if (seedResult.seeded) toast.success(`Catalog seeded with ${seedResult.count} products ✨`)
      const [prods, brand] = await Promise.all([fetchProducts(), fetchBranding()])
      setProducts(prods)
      if (brand) setBranding({ ...brand, phone2: null })
    } catch (err) {
      console.error(err)
      const msg = (err && (err.message || String(err))) || 'Failed to load catalog.'
      const missing = /schema cache|PGRST205|does not exist|relation .* does not/i.test(msg)
      if (missing) setNeedsSetup(true)
      setLoadError(msg)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])
useEffect(() => {
  const params = new URLSearchParams(
    window.location.search
  )

  const catalogId =
    params.get('catalog')

  if (!catalogId) return

  let cancelled = false

  async function loadSharedCatalog() {
    setSharedCatalogLoading(true)

    try {
      const savedProducts =
        await fetchSharedCatalog(catalogId)

      if (!cancelled) {
        setSharedCatalog(savedProducts)
      }
    } catch (error) {
      console.error(
        'Shared catalog error:',
        error
      )

      if (!cancelled) {
        setSharedCatalog([])
      }
    } finally {
      if (!cancelled) {
        setSharedCatalogLoading(false)
      }
    }
  }

  loadSharedCatalog()

  return () => {
    cancelled = true
  }
}, [])
  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const catalog = params.get('catalog')

  if (!catalog) return

  const ids = catalog
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)

  if (ids.length > 0) {
    setSharedCatalogIds(ids)
  }
}, [])

  const counts = useMemo(() => {
    const c = { All: products.length }
    for (const p of products) c[p.category] = (c[p.category] || 0) + 1
    return c
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(p => {
      if (category !== 'All' && p.category !== category) return false
      if (!q) return true
      const hay = `${p.brand} ${p.name} ${p.description || ''} ${p.packaging || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [products, category, query])

  const wishlistSet = useMemo(() => new Set(wishlist), [wishlist])
  const wishlistProducts = useMemo(() =>
    wishlist.map(id => products.find(p => p.id === id)).filter(Boolean),
    [wishlist, products])

  function toggleWishlist(p) {
    setWishlist(w => {
      if (w.includes(p.id)) { toast.info('Removed from wishlist'); return w.filter(x => x !== p.id) }
      toast.success('Added to wishlist ❤️'); return [...w, p.id]
    })
  }

  async function handleSaveProduct(payload) {
    if (editing && editing.id) await updateProduct(editing.id, payload)
    else await insertProduct(payload)
    const prods = await fetchProducts(); setProducts(prods)
  }
  async function handleDeleteProduct(product) {
    if (!confirm(`Delete “${product.brand} — ${product.name}”?`)) return
    try {
      await deleteProduct(product.id)
      const prods = await fetchProducts(); setProducts(prods)
      toast.success('Product deleted')
    } catch (err) { toast.error(err.message || 'Delete failed') }
  }
  async function handleReset() {
    if (!confirm('Reset the entire catalog back to the default 125 seed products?')) return
    const tId = toast.loading('Resetting catalog…')
    try {
      await resetCatalog()
      const prods = await fetchProducts(); setProducts(prods)
      toast.dismiss(tId); toast.success('Catalog reset to seed')
    } catch (err) { toast.dismiss(tId); toast.error(err.message || 'Reset failed') }
  }
  function handleExport() {
    const json = exportJson(products, branding)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `divine-traders-catalog-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
    toast.success('Catalog exported')
  }
  async function handleSaveBranding(patch) {
    const updated = await upsertBranding(patch)
    setBranding({ ...updated, phone2: null })
  }

  function scrollToCatalog() {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleShare() {
    const shareText = `🌸 ${branding.business_name || 'Divine Traders'} — wholesale catalog\n` +
      `${branding.tagline || ''}\n\n🔗 ${window.location.href}`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    if (navigator.share) {
      navigator.share({ title: branding.business_name || 'Divine Traders', text: shareText, url: window.location.href })
        .catch(() => window.open(waUrl, '_blank'))
    } else {
      window.open(waUrl, '_blank')
    }
  }

  const isUnlocked = showPrices || editMode

  function handleLockIconClick() {
    // If unlocked, tapping the icon locks everything back.
    if (isUnlocked) {
      setShowPrices(false); setEditMode(false)
      toast.info('Locked — back to buyer view')
    } else {
      setUnlockOpen(true)
    }
  }

  return (
    <div className="min-h-screen">
      <BusinessCard
        branding={branding}
        onBrowse={scrollToCatalog}
        onShare={handleShare}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setWishlistOpen(true)}
      />

      <main ref={catalogRef} className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-32 safe-bottom scroll-mt-2">
        {editMode && (
          <AdminBar
            onAdd={() => { setEditing(null); setEditorOpen(true) }}
            onBranding={() => setBrandingOpen(true)}
            onExport={handleExport}
            onReset={handleReset}
            onExit={() => { setEditMode(false); toast.info('Exited edit mode') }}
          />
        )}

        {needsSetup ? (
          <SetupScreen errorMessage={loadError} onRetry={loadAll} />
        ) : (
        <>
          <div className="card-surface rounded-3xl p-3 sm:p-4 mb-4 sm:mb-5 shadow-soft">
            <div className="flex items-center gap-2 bg-ivory-50 border border-ivory-200 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 mb-3 focus-within:border-gold-300 focus-within:bg-white transition min-w-0">
              <span className="text-rose-500 text-base sm:text-lg flex-shrink-0">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search catalog"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-base text-cocoa-900 placeholder:text-cocoa-500"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-cocoa-500 hover:text-rose-500 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full">✕</button>
              )}
            </div>
            <CategoryTabs value={category} onChange={setCategory} counts={counts} />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse h-72 sm:h-96 bg-ivory-100" />
              ))}
            </div>
          ) : loadError ? (
            <div className="card-surface rounded-3xl p-8 text-center">
              <div className="text-5xl mb-3">🛠️</div>
              <h3 className="font-display text-xl font-bold text-rose-500">Something went wrong</h3>
              <p className="text-cocoa-500 mt-2 text-sm max-w-md mx-auto">{loadError}</p>
              <button type="button" onClick={loadAll} className="btn-primary mt-4">↻ Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-surface rounded-3xl p-10 text-center">
              <div className="text-5xl mb-3">🌸</div>
              <p className="text-cocoa-500">No products match your search.</p>
            </div>
          ) : (
            <ProgressiveProductGrid
  products={filtered}
  showPrices={showPrices}
  editMode={editMode}
  wishlistSet={wishlistSet}
  onEdit={(prod) => {
    setEditing(prod)
    setEditorOpen(true)
  }}
  onDelete={handleDeleteProduct}
  onToggleWishlist={toggleWishlist}
/>
          )}
        </>
        )}
      </main>

      {/* Floating action buttons (icons only) */}
      <div className="fixed right-3 sm:right-5 z-40 flex flex-col gap-2 items-end" style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        {wishlist.length > 0 && (
          <button type="button" onClick={() => setWishlistOpen(true)}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-rose-500 shadow-hero flex items-center justify-center border border-ivory-200 active:scale-95"
            title="Wishlist">
            <span className="text-xl">♥</span>
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold shadow-sm">
              {wishlist.length}
            </span>
          </button>
        )}
        <button type="button" onClick={handleShare}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-emerald-500 shadow-hero flex items-center justify-center border border-ivory-200 active:scale-95"
          title="Share catalog on WhatsApp">
          <span className="text-xl">📤</span>
        </button>
        <button type="button" onClick={handleLockIconClick}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-hero flex items-center justify-center border transition active:scale-95 ${
            isUnlocked
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-400 text-white border-emerald-200'
              : 'bg-gradient-to-br from-rose-500 to-gold-400 text-white border-rose-200'
          }`}
          title={isUnlocked ? 'Lock the site' : 'Unlock / Admin'}>
          <span className="text-xl">{isUnlocked ? '🔓' : '🔒'}</span>
        </button>
      </div>

      <UnlockModal
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        showingPrices={showPrices}
        onShowPrices={() => {
          setShowPrices(v => { const nv = !v; toast.info(nv ? 'Prices visible' : 'Prices hidden'); return nv })
        }}
        onEditMode={() => { setEditMode(true); setUnlockOpen(false); toast.success('Edit mode unlocked ✨') }}
        adminPassword={branding.admin_password || DEFAULT_BRANDING.admin_password}
      />

      <ProductEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveProduct}
      />

      <BrandingEditor
        open={brandingOpen}
        initial={branding}
        onClose={() => setBrandingOpen(false)}
        onSave={handleSaveBranding}
      />

      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        items={wishlistProducts}
        onRemove={(id) => setWishlist(w => w.filter(x => x !== id))}
        onClear={() => { setWishlist([]); toast.info('Wishlist cleared') }}
        phone={branding.phone1}
      />

      {sharedCatalogLoading && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-cocoa-900/80 backdrop-blur-md">
    <div className="flex flex-col items-center gap-3 text-white">
      <div className="catalog-spinner-ring" />

      <span className="text-xs font-semibold">
        Opening your catalog…
      </span>
    </div>
  </div>
)}

{sharedCatalog && (
  <SharedCatalog
    products={sharedCatalog}
    showPrices={showPrices}
    onClose={() => {
      setSharedCatalog(null)

      const url = new URL(
        window.location.href
      )

      url.searchParams.delete('catalog')

      window.history.replaceState(
        {},
        '',
        url.pathname +
          url.search +
          url.hash
      )
    }}
  />
)}

<ToastStack />

<footer className="text-center text-xs text-cocoa-500 py-6 safe-bottom">
  © {new Date().getFullYear()} {branding.business_name || 'Divine Traders'} — Made with 🌸
</footer>
    </div>
  )
}