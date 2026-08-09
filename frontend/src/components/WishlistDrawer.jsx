import React from 'react'

function formatPrice(p) {
  if (p === null || p === undefined || p === '') return '₹—'
  const n = Number(p); if (Number.isNaN(n)) return '₹—'
  return `₹${n.toLocaleString('en-IN')}`
}

export default function WishlistDrawer({ open, onClose, items, onRemove, onClear, phone }) {
  if (!open) return null

  const cleanPhone = (phone || '').replace(/[^0-9]/g, '')
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  const lines = items.map((p, i) => {
    const brand = p.brand || ''
    const priceStr = (p.price !== null && p.price !== undefined) ? ` — ${formatPrice(p.price)}` : ''
    return `${i + 1}. ${brand ? brand + ' — ' : ''}${p.name}${priceStr}`
  })
  const shareText = [
    '🌸 Hi Divine Traders!',
    'I would like to enquire about these products from your catalog:',
    '',
    ...lines,
    '',
    `Sent from your catalog — ${now}`,
  ].join('\n')

  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-cocoa-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col card-surface rounded-t-3xl sm:rounded-3xl shadow-hero animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-ivory-200 sticky top-0 bg-white/95 backdrop-blur rounded-t-3xl">
          <div>
            <h2 className="font-display text-2xl font-black text-shimmer flex items-center gap-2">♥ My Wishlist</h2>
            <p className="text-xs text-cocoa-500">{items.length} product{items.length === 1 ? '' : 's'} selected</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-ivory-50 hover:bg-white text-rose-500 flex items-center justify-center border border-ivory-200">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-2">🌸</div>
              <p className="text-cocoa-500">Tap the ♡ icon on any product to add it to your wishlist.</p>
            </div>
          ) : (
            items.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-ivory-50 border border-ivory-200 rounded-2xl p-2.5">
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border border-ivory-200">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-60">📷</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-rose-500 truncate">{p.brand}</span>
                    <span className="text-[9px] text-gold-500 uppercase tracking-wider">{p.category}</span>
                  </div>
                  <div className="font-semibold text-cocoa-900 text-sm truncate">{p.name}</div>
                  {(p.price !== null && p.price !== undefined) && (
                    <div className="text-xs font-bold text-shimmer">{formatPrice(p.price)}</div>
                  )}
                </div>
                <button type="button" onClick={() => onRemove(p.id)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-sm flex items-center justify-center border border-ivory-200 flex-shrink-0">✕</button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-ivory-200 flex gap-2 safe-bottom bg-white/95 backdrop-blur">
          {items.length > 0 && (
            <button type="button" onClick={onClear} className="btn-ghost text-sm">Clear all</button>
          )}
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className={`btn-primary flex-1 justify-center ${items.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
            💬 Send via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
