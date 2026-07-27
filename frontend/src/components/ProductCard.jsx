import React, { useState } from 'react'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '₹—'
  const n = Number(price)
  if (Number.isNaN(n)) return '₹—'
  return `₹${n.toLocaleString('en-IN')}`
}

export default function ProductCard({ product, showPrices, editMode, onEdit, onDelete, inWishlist, onToggleWishlist }) {
  const hasVariants = (product.variants || []).length > 0
  const [variantIdx, setVariantIdx] = useState(0)
  const activeVariant = hasVariants ? product.variants[variantIdx] : null
  const imageUrl = (activeVariant && activeVariant.image_url) || product.image_url
  const price = activeVariant ? activeVariant.price : product.price

  return (
    <div className="card group flex flex-col animate-fade-in">
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-ivory-50 via-blush-50 to-gold-50 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 text-blush-500">
            <span className="text-3xl sm:text-4xl mb-1 opacity-60">📷</span>
            <span className="text-[10px] sm:text-xs font-medium opacity-70">No photo yet</span>
          </div>
        )}

        {/* Wishlist heart (top-right, buyers only) */}
        {!editMode && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(product) }}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-sm border transition ${
              inWishlist ? 'bg-rose-500 border-rose-500 text-white scale-105' : 'bg-white/95 border-ivory-200 text-rose-400 hover:text-rose-500'
            }`}>
            <span className="text-base">{inWishlist ? '♥' : '♡'}</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        {/* Brand + Category chips (no overlap now) */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-blush-50 border border-blush-100 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-rose-500 max-w-full">
            <span className="text-gold-500">✦</span>
            <span className="truncate">{product.brand}</span>
          </span>
          <span className="inline-block bg-gradient-to-r from-rose-500/90 to-gold-400/90 text-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
            {product.category}
          </span>
        </div>

        <h3 className="font-bold text-cocoa-900 leading-snug line-clamp-2 text-sm sm:text-base">{product.name}</h3>
        {product.description && (
          <p className="text-[11px] sm:text-xs text-cocoa-500 mt-1 line-clamp-2">{product.description}</p>
        )}
        {product.packaging && (
          <p className="text-[10px] sm:text-[11px] text-gold-600 italic mt-1 flex items-start gap-1">
            <span className="mt-0.5">📦</span>
            <span className="line-clamp-1">{product.packaging}</span>
          </p>
        )}

        {hasVariants && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.variants.map((v, i) => (
              <button key={v.id || i} type="button" onClick={() => setVariantIdx(i)}
                className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full transition-all ${
                  i === variantIdx
                    ? 'bg-gradient-to-r from-rose-500 to-gold-400 text-white shadow-sm'
                    : 'bg-blush-50 text-rose-500 hover:bg-blush-100 border border-ivory-200'
                }`}>
                {v.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-cocoa-500 font-bold">Wholesale</div>
            {showPrices ? (
              <div className="text-lg sm:text-xl font-black text-shimmer">{formatPrice(price)}</div>
            ) : (
              <div className="text-xs sm:text-sm font-semibold text-cocoa-500 flex items-center gap-1">
                <span>🔒</span> Unlock to view
              </div>
            )}
          </div>
          {editMode && (
            <div className="flex gap-1">
              <button type="button" onClick={() => onEdit(product)} title="Edit"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-blush-50 text-rose-500 shadow-sm flex items-center justify-center transition border border-ivory-200">✏️</button>
              <button type="button" onClick={() => onDelete(product)} title="Delete"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-sm flex items-center justify-center transition border border-ivory-200">🗑️</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
