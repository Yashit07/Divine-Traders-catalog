import React, { useEffect, useMemo, useState } from 'react'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '₹—'
  const n = Number(price)
  if (Number.isNaN(n)) return '₹—'
  return `₹${n.toLocaleString('en-IN')}`
}

function optimizeImage(url, width = 1000) {
  if (!url) return null

  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=85&output=webp`
}

function getProductImages(product, activeVariant) {
  const gallery = Array.isArray(product.image_urls)
    ? product.image_urls.filter(Boolean)
    : []

  /*
   * Keep backwards compatibility with existing products.
   *
   * If image_urls is empty, the old image_url is still used.
   */
  if (gallery.length === 0 && product.image_url) {
    gallery.push(product.image_url)
  }

  /*
   * If the selected variant has its own image,
   * show it first.
   */
  if (activeVariant?.image_url) {
    return [
      activeVariant.image_url,
      ...gallery.filter(url => url !== activeVariant.image_url),
    ]
  }

  return gallery
}

function ImageElement({ src, alt, className = '' }) {
  const imageUrl = optimizeImage(src, 1200)

  if (!imageUrl) return null

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      draggable="false"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

export default function ProductCard({
  product,
  showPrices,
  editMode,
  onEdit,
  onDelete,
  inWishlist,
  onToggleWishlist,
}) {
  const hasVariants = (product.variants || []).length > 0

  const [variantIdx, setVariantIdx] = useState(0)

  /*
   * viewerOpen controls the large product viewer.
   */
  const [viewerOpen, setViewerOpen] = useState(false)

  /*
   * imageIndex is ONLY for the large viewer.
   *
   * It does NOT automatically change.
   */
  const [imageIndex, setImageIndex] = useState(0)

  /*
   * cardImageIndex is ONLY for the small product card.
   *
   * This is the image that automatically changes every 3 seconds.
   */
  const [cardImageIndex, setCardImageIndex] = useState(0)

  const activeVariant = hasVariants
    ? product.variants[variantIdx]
    : null

  const images = useMemo(
    () => getProductImages(product, activeVariant),
    [product, activeVariant]
  )

  const price = activeVariant
    ? activeVariant.price
    : product.price

  /*
   * Keep the small-card image index valid
   * if the number of images changes.
   */
  useEffect(() => {
    if (cardImageIndex >= images.length) {
      setCardImageIndex(0)
    }
  }, [images.length, cardImageIndex])

  /*
   * Keep the large-viewer image index valid
   * if the number of images changes.
   */
  useEffect(() => {
    if (imageIndex >= images.length) {
      setImageIndex(0)
    }
  }, [images.length, imageIndex])

  /*
   * ============================================================
   * SMALL CARD AUTO-SLIDESHOW
   * ============================================================
   *
   * This runs ONLY while the large viewer is CLOSED.
   *
   * Every 3 seconds:
   *
   * Image 1 → Image 2 → Image 3 → Image 4 → Image 1...
   *
   * Once the large viewer opens, this timer stops.
   */
  useEffect(() => {
    if (viewerOpen || images.length <= 1) return

    const timer = window.setInterval(() => {
      setCardImageIndex(current => {
        return (current + 1) % images.length
      })
    }, 3000)

    return () => window.clearInterval(timer)
  }, [viewerOpen, images.length])

  /*
   * ============================================================
   * KEYBOARD CONTROLS FOR LARGE VIEWER
   * ============================================================
   *
   * ESC      = close
   * ←        = previous image
   * →        = next image
   *
   * IMPORTANT:
   * There is NO automatic timer here.
   */
  useEffect(() => {
    if (!viewerOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setViewerOpen(false)
        return
      }

      if (e.key === 'ArrowRight' && images.length > 1) {
        setImageIndex(current => {
          return (current + 1) % images.length
        })
      }

      if (e.key === 'ArrowLeft' && images.length > 1) {
        setImageIndex(current => {
          return (
            (current - 1 + images.length) %
            images.length
          )
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [viewerOpen, images.length])

  /*
   * Prevent the page underneath from scrolling
   * while the large viewer is open.
   */
  useEffect(() => {
    if (!viewerOpen) return

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [viewerOpen])

  /*
   * Open the large viewer.
   *
   * We start at the image currently being shown
   * on the small card.
   */
  function openViewer() {
    setImageIndex(
      Math.min(
        cardImageIndex,
        Math.max(images.length - 1, 0)
      )
    )

    setViewerOpen(true)
  }

  function closeViewer() {
    setViewerOpen(false)
  }

  /*
   * Large viewer → previous image.
   * Manual only.
   */
  function previousImage(e) {
    e?.stopPropagation()

    if (images.length <= 1) return

    setImageIndex(current => {
      return (
        (current - 1 + images.length) %
        images.length
      )
    })
  }

  /*
   * Large viewer → next image.
   * Manual only.
   */
  function nextImage(e) {
    e?.stopPropagation()

    if (images.length <= 1) return

    setImageIndex(current => {
      return (current + 1) % images.length
    })
  }

  /*
   * Change product variant.
   *
   * Both small-card and large-viewer image positions
   * reset because the available images may have changed.
   */
  function handleVariantChange(index) {
    setVariantIdx(index)
    setImageIndex(0)
    setCardImageIndex(0)
  }

  /*
   * Small card uses cardImageIndex.
   *
   * Large viewer uses imageIndex.
   */
  const cardImage =
    images[cardImageIndex] || images[0]

  return (
    <>
      {/* =========================================================
          NORMAL PRODUCT CARD
      ========================================================= */}

      <div
        className="card group flex flex-col animate-fade-in cursor-pointer"
        onClick={openViewer}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' ||
            e.key === ' '
          ) {
            e.preventDefault()
            openViewer()
          }
        }}
      >
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-ivory-50 via-blush-50 to-gold-50 overflow-hidden">
          {cardImage ? (
            <ImageElement
              src={cardImage}
              alt={product.name}
              className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 text-blush-500">
              <span className="text-3xl sm:text-4xl mb-1 opacity-60">
                📷
              </span>

              <span className="text-[10px] sm:text-xs font-medium opacity-70">
                No photo yet
              </span>
            </div>
          )}

          {/* Image count */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-2 bg-cocoa-900/70 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
              📷 {images.length}
            </div>
          )}

          {/* Wishlist */}
          {!editMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleWishlist?.(product)
              }}
              title={
                inWishlist
                  ? 'Remove from wishlist'
                  : 'Add to wishlist'
              }
              className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-sm border transition ${
                inWishlist
                  ? 'bg-rose-500 border-rose-500 text-white scale-105'
                  : 'bg-white/95 border-ivory-200 text-rose-400 hover:text-rose-500'
              }`}
            >
              <span className="text-base">
                {inWishlist ? '♥' : '♡'}
              </span>
            </button>
          )}

          {/* Click hint */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-cocoa-700 text-[9px] sm:text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm">
            Tap to view
          </div>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Brand + Category */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-blush-50 border border-blush-100 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-rose-500 max-w-full">
              <span className="text-gold-500">
                ✦
              </span>

              <span className="truncate">
                {product.brand}
              </span>
            </span>

            <span className="inline-block bg-gradient-to-r from-rose-500/90 to-gold-400/90 text-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
              {product.category}
            </span>
          </div>

          <h3 className="font-bold text-cocoa-900 leading-snug line-clamp-2 text-sm sm:text-base">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-[11px] sm:text-xs text-cocoa-500 mt-1 line-clamp-2">
              {product.description}
            </p>
          )}

          {product.packaging && (
            <p className="text-[10px] sm:text-[11px] text-gold-600 italic mt-1 flex items-start gap-1">
              <span className="mt-0.5">
                📦
              </span>

              <span className="line-clamp-1">
                {product.packaging}
              </span>
            </p>
          )}

          {/* Variants */}
          {hasVariants && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.variants.map(
                (v, i) => (
                  <button
                    key={v.id || i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVariantChange(i)
                    }}
                    className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full transition-all ${
                      i === variantIdx
                        ? 'bg-gradient-to-r from-rose-500 to-gold-400 text-white shadow-sm'
                        : 'bg-blush-50 text-rose-500 hover:bg-blush-100 border border-ivory-200'
                    }`}
                  >
                    {v.name}
                  </button>
                )
              )}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto pt-3 flex items-end justify-between">
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-cocoa-500 font-bold">
                Wholesale
              </div>

              {showPrices ? (
                <div className="text-lg sm:text-xl font-black text-shimmer">
                  {formatPrice(price)}
                </div>
              ) : (
                <div className="text-xs sm:text-sm font-semibold text-cocoa-500 flex items-center gap-1">
                  <span>🔒</span>
                  Unlock to view
                </div>
              )}
            </div>

            {editMode && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(product)
                  }}
                  title="Edit"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-blush-50 text-rose-500 shadow-sm flex items-center justify-center transition border border-ivory-200"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(product)
                  }}
                  title="Delete"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-sm flex items-center justify-center transition border border-ivory-200"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          LARGE PRODUCT VIEWER
      ========================================================= */}

      {viewerOpen && (
        <div
          className="product-viewer-overlay"
          onClick={closeViewer}
        >
          <div
            className="product-viewer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeViewer}
              className="product-viewer-close"
              aria-label="Close product"
            >
              ✕
            </button>

            {/* Image section */}
            <div className="product-viewer-image-section">
              {images.length > 0 ? (
                <ImageElement
                  key={images[imageIndex]}
                  src={images[imageIndex]}
                  alt={product.name}
                  className="product-viewer-image"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-cocoa-500 h-full">
                  <span className="text-6xl mb-3">
                    📷
                  </span>

                  <span>
                    No product image
                  </span>
                </div>
              )}

              {/* Previous */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={previousImage}
                  className="product-viewer-arrow product-viewer-arrow-left"
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}

              {/* Next */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  className="product-viewer-arrow product-viewer-arrow-right"
                  aria-label="Next image"
                >
                  ›
                </button>
              )}

              {/* Image counter */}
              {images.length > 1 && (
                <div className="product-viewer-counter">
                  {imageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Product information */}
            <div className="product-viewer-content">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1 bg-blush-50 border border-blush-100 px-3 py-1 rounded-full text-xs font-bold text-rose-500">
                  <span className="text-gold-500">
                    ✦
                  </span>

                  {product.brand}
                </span>

                <span className="inline-block bg-gradient-to-r from-rose-500/90 to-gold-400/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {product.category}
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-black text-cocoa-900 leading-tight">
                {product.name}
              </h2>

              {product.description && (
                <p className="text-sm sm:text-base text-cocoa-600 mt-3 leading-relaxed">
                  {product.description}
                </p>
              )}

              {product.packaging && (
                <div className="mt-3 bg-gold-50 border border-gold-200 rounded-2xl px-4 py-3 text-sm text-cocoa-700">
                  <span className="font-bold text-gold-600">
                    📦 Packaging:
                  </span>{' '}
                  {product.packaging}
                </div>
              )}

              {/* Viewer variants */}
              {hasVariants && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-cocoa-500 mb-2">
                    Variants
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(
                      (v, i) => (
                        <button
                          key={v.id || i}
                          type="button"
                          onClick={() =>
                            handleVariantChange(i)
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            i === variantIdx
                              ? 'bg-gradient-to-r from-rose-500 to-gold-400 text-white shadow-sm'
                              : 'bg-blush-50 text-rose-500 border border-ivory-200 hover:bg-blush-100'
                          }`}
                        >
                          {v.name}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="mt-5 pt-4 border-t border-ivory-200">
                <div className="text-[10px] uppercase tracking-widest text-cocoa-500 font-bold">
                  Wholesale Price
                </div>

                {showPrices ? (
                  <div className="text-2xl sm:text-3xl font-black text-shimmer mt-1">
                    {formatPrice(price)}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-cocoa-500 mt-1">
                    🔒 Unlock to view wholesale price
                  </div>
                )}
              </div>

              {/* Dots */}
              {images.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setImageIndex(i)
                      }
                      aria-label={`View image ${i + 1}`}
                      className={`product-viewer-dot ${
                        i === imageIndex
                          ? 'product-viewer-dot-active'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              )}

              {images.length > 1 && (
                <p className="text-center text-[10px] text-cocoa-500 mt-2">
                  Use the arrows or dots to change photos
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}