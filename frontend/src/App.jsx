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
import {
  fetchProducts, insertProduct, updateProduct, deleteProduct,
  fetchBranding, upsertBranding, ensureSeeded, resetCatalog, exportJson, logoutAdmin
} from './lib/db'
import { SUPABASE_READY } from './lib/supabase'
import { DEFAULT_BRANDING } from './lib/seed'
import { toast } from './lib/toast'

const LS_KEYS = {
  showPrices: 'dt_show_prices',
  wishlist:   'dt_wishlist_v1',
}

function lsGet(k, def) {
  try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v) } catch { return def }
}
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

export default function App() {
  const [products, setProducts] = useState([])
  const [branding, setBranding] = useState(DEFAULT_BRANDING)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [needsSetup, setNeedsSetup] = useState(false)

  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')

  // Admin & Buyer state
  const [showPrices, setShowPrices] = useState(() => lsGet(LS_KEYS.showPrices, false))
  const [editMode, setEditMode] = useState(false)
  const [wishlist, setWishlist] = useState(() => lsGet(LS_KEYS.wishlist, []))

  // Modal & Drawer states
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [brandingOpen, setBrandingOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // Expanded Product & Lightbox Player states
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [fullScreenImage, setFullScreenImage] = useState(null)
  const [zoomScale, setZoomScale] = useState(1)

  const catalogRef = useRef(null)

  // Zoom handlers
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.5, 3.5))
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.5, 1))
  const resetZoom = () => setZoomScale(1)
  const closePhotoPlayer = () => { setFullScreenImage(null); resetZoom() }

  // Persist local preferences
  useEffect(() => { lsSet(LS_KEYS.showPrices, showPrices) }, [showPrices])
  useEffect(() => { lsSet(LS_KEYS.wishlist, wishlist) }, [wishlist])

  async function loadAll() {
    setLoading(true); setLoadError(''); setNeedsSetup(false)
    try {
      if (!SUPABASE_READY) throw new Error('Supabase configuration missing')
      const seedResult = await ensureSeeded()
      if (seedResult.seeded) toast.success(`Catalog loaded ✨`)
      const [prods, brand] = await Promise.all([fetchProducts(), fetchBranding()])
      setProducts(prods)
      if (brand) setBranding(brand)
    } catch (err) {
      console.error(err)
      const msg = (err && (err.message || String(err))) || 'Failed to load catalog.'
      const missing = /schema cache|PGRST205|does not exist|relation .* does not/i.test(msg)
      if (missing) setNeedsSetup(true)
      setLoadError(msg)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

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
      const hay = `${p.brand || ''} ${p.name || ''} ${p.description || ''} ${p.packaging || ''}`.toLowerCase()
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
    try {
      if (editing && editing.id) {
        await updateProduct(editing.id, payload)
        toast.success('Product updated successfully')
      } else {
        await insertProduct(payload)
        toast.success('Product added successfully')
      }
      const prods = await fetchProducts()
      setProducts(prods)
      setEditorOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to save product')
    }
  }

  async function handleDeleteProduct(product) {
    if (!confirm(`Delete “${product.brand ? product.brand + ' — ' : ''}${product.name}”?`)) return
    try {
      await deleteProduct(product.id)
      const prods = await fetchProducts()
      setProducts(prods)
      toast.success('Product deleted')
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  async function handleReset() {
    if (!confirm('Reset the entire catalog back to default?')) return
    const tId = toast.loading('Resetting catalog…')
    try {
      await resetCatalog()
      const prods = await fetchProducts()
      setProducts(prods)
      toast.dismiss(tId)
      toast.success('Catalog reset')
    } catch (err) {
      toast.dismiss(tId)
      toast.error(err.message || 'Reset failed')
    }
  }

  function handleExport() {
    const json = exportJson(products, branding)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `catalog-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
    toast.success('Catalog exported')
  }

  async function handleSaveBranding(patch) {
    try {
      const updated = await upsertBranding(patch)
      setBranding(updated)
      setBrandingOpen(false)
      toast.success('Branding saved')
    } catch (err) {
      toast.error(err.message || 'Failed to update branding')
    }
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
        .catch((err) => {
          if (err.name !== 'AbortError') window.open(waUrl, '_blank')
        })
    } else {
      window.open(waUrl, '_blank')
    }
  }

  const isUnlocked = editMode

  function handleLockIconClick() {
    if (isUnlocked) {
      setEditMode(false)
      logoutAdmin()
      toast.info('Locked — returned to buyer view')
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
            onExit={() => { setEditMode(false); logoutAdmin(); toast.info('Exited edit mode') }}
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
                placeholder="Search catalog…"
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((p) => (
                <div key={p.id} onClick={() => setSelectedProduct(p)} className="cursor-pointer transition-transform hover:-translate-y-1">
                  <ProductCard
                    product={p}
                    showPrices={showPrices}
                    editMode={editMode}
                    onEdit={(prod) => { setEditing(prod); setEditorOpen(true) }}
                    onDelete={handleDeleteProduct}
                    inWishlist={wishlistSet.has(p.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                </div>
              ))}
            </div>
          )}
        </>
        )}
      </main>

      {/* Floating action buttons */}
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
          title={isUnlocked ? 'Lock Admin View' : 'Unlock / Admin'}>
          <span className="text-xl">{isUnlocked ? '🔓' : '🔒'}</span>
        </button>
      </div>

      {/* --- PRODUCT DETAILS MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative card-surface rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ivory-200 text-cocoa-700 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center font-bold text-lg z-10"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center mt-2">
              <div
                onClick={() => setFullScreenImage(selectedProduct.image_url || selectedProduct.image)}
                className="relative group cursor-zoom-in overflow-hidden rounded-2xl bg-ivory-100 border border-ivory-200 flex items-center justify-center"
              >
                <img
                  src={selectedProduct.image_url || selectedProduct.image || '/placeholder.png'}
                  alt={selectedProduct.name}
                  className="w-full h-64 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold tracking-wide transition-opacity backdrop-blur-[2px]">
                  🔍 Tap to Expand & Zoom Photo
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full w-fit">
                  {selectedProduct.brand || selectedProduct.category}
                </span>

                <h2 className="font-display text-2xl font-bold text-cocoa-900 leading-tight">
                  {selectedProduct.name}
                </h2>

                {selectedProduct.packaging && (
                  <p className="text-xs text-cocoa-500 font-medium">
                    📦 Packaging: {selectedProduct.packaging}
                  </p>
                )}

                {showPrices && (
                  <p className="text-2xl font-extrabold text-emerald-600">
                    ₹{selectedProduct.price}
                  </p>
                )}

                <p className="text-sm text-cocoa-700 leading-relaxed bg-ivory-50 p-3 rounded-xl border border-ivory-200 mt-1">
                  {selectedProduct.description || 'Premium wholesale quality product available for bulk orders.'}
                </p>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(selectedProduct)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition border flex items-center justify-center gap-2 ${
                      wishlistSet.has(selectedProduct.id)
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-white text-rose-500 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <span>{wishlistSet.has(selectedProduct.id) ? '♥ In Wishlist' : '♡ Add to Wishlist'}</span>
                  </button>

                  <a
                    href={`https://wa.me/${branding.phone1 || ''}?text=Hi!%20I%20am%20interested%20in%20buying:%20${encodeURIComponent(selectedProduct.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-center text-sm transition flex items-center justify-center gap-1 shadow-md"
                  >
                    <span>💬 Inquiry</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- FULL-SCREEN PHOTO PLAYER --- */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 select-none backdrop-blur-md">
          <button
            type="button"
            onClick={closePhotoPlayer}
            className="absolute top-5 right-5 text-white bg-white/20 hover:bg-rose-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl transition-colors z-50 shadow-lg"
            aria-label="Close photo viewer"
          >
            ✕
          </button>

          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={fullScreenImage}
              alt="Expanded view"
              style={{ transform: `scale(${zoomScale})` }}
              className="max-w-full max-h-[85vh] object-contain transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing"
            />
          </div>

          <div className="absolute bottom-6 flex items-center gap-4 bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full z-50 text-white border border-white/20 shadow-2xl">
            <button type="button" onClick={handleZoomOut} className="hover:text-amber-400 font-bold text-xl px-2 active:scale-95 transition" title="Zoom Out">−</button>
            <span className="text-xs font-mono font-semibold min-w-[50px] text-center">{Math.round(zoomScale * 100)}%</span>
            <button type="button" onClick={handleZoomIn} className="hover:text-amber-400 font-bold text-xl px-2 active:scale-95 transition" title="Zoom In">+</button>
            <button type="button" onClick={resetZoom} className="hover:text-amber-400 text-xs font-semibold border-l border-white/20 pl-3 ml-1 active:scale-95 transition" title="Reset Zoom">Reset</button>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <UnlockModal
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        showingPrices={showPrices}
        onShowPrices={() => {
          setShowPrices(v => { const nv = !v; toast.info(nv ? 'Prices visible' : 'Prices hidden'); return nv })
        }}
        onEditMode={() => setEditMode(true)}
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

      <ToastStack />

      <footer className="text-center text-xs text-cocoa-500 py-6 safe-bottom">
        © {new Date().getFullYear()} {branding.business_name || 'Divine Traders'} — Made with 🌸
      </footer>
    </div>
  )
}
