import React, { useEffect, useMemo, useRef, useState } from 'react'

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

function ImageElement({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
}) {
  const imageUrl = optimizeImage(src, 1200)

  const [loaded, setLoaded] = useState(false)

  if (!imageUrl) return null

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ivory-50 via-blush-50 to-gold-50">
          <div className="catalog-spinner-ring" />
        </div>
      )}

      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${
          loaded
            ? 'opacity-100'
            : 'opacity-0'
        } transition-opacity duration-300`}
        loading={
          priority ? 'eager' : loading
        }
        fetchPriority={
          priority ? 'high' : 'auto'
        }
        decoding="async"
        draggable="false"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
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

  /*
   * ============================================================
   * PRODUCT / IMAGE STATE
   * ============================================================
   */

  const [variantIdx, setVariantIdx] = useState(0)

  /*
   * Large product card.
   */
  const [viewerOpen, setViewerOpen] = useState(false)

  /*
   * Image currently displayed in the large product card.
   *
   * This is manual only.
   */
  const [imageIndex, setImageIndex] = useState(0)

  /*
   * Image currently displayed in the small product card.
   *
   * This automatically changes every 3 seconds.
   */
  const [cardImageIndex, setCardImageIndex] = useState(0)

  /*
   * Full-screen image viewer.
   */
  const [fullscreenViewerOpen, setFullscreenViewerOpen] =
    useState(false)

  /*
   * Image currently displayed in the full-screen viewer.
   */
  const [fullscreenImageIndex, setFullscreenImageIndex] =
    useState(0)

  /*
   * ============================================================
   * LARGE CARD TOUCH / DRAG STATE
   * ============================================================
   */

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchDirection = useRef(null)
  const isTouching = useRef(false)

  const [dragOffsetY, setDragOffsetY] = useState(0)

  /*
   * ============================================================
   * FULLSCREEN TOUCH / SWIPE STATE
   * ============================================================
   */

  const fullscreenTouchStartX = useRef(0)
  const fullscreenTouchStartY = useRef(0)
  const fullscreenTouchDirection = useRef(null)
  const fullscreenIsTouching = useRef(false)

  /*
   * ============================================================
   * GESTURE HINT STATE
   * ============================================================
   */

  const [showGestureHints, setShowGestureHints] =
    useState(false)

  const gestureHintTimer = useRef(null)

  /*
   * ============================================================
   * PRODUCT DATA
   * ============================================================
   */

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
   * ============================================================
   * KEEP IMAGE INDICES VALID
   * ============================================================
   */

  useEffect(() => {
    if (cardImageIndex >= images.length) {
      setCardImageIndex(0)
    }
  }, [images.length, cardImageIndex])

  useEffect(() => {
    if (imageIndex >= images.length) {
      setImageIndex(0)
    }
  }, [images.length, imageIndex])

  useEffect(() => {
    if (fullscreenImageIndex >= images.length) {
      setFullscreenImageIndex(0)
    }
  }, [images.length, fullscreenImageIndex])

  /*
   * ============================================================
   * SMALL CARD AUTO-SLIDESHOW
   * ============================================================
   *
   * Only the SMALL card automatically changes.
   *
   * The large viewer and full-screen viewer never
   * automatically change images.
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
   * KEYBOARD CONTROLS
   * ============================================================
   *
   * Large viewer:
   *
   * ESC       = close
   * ←         = previous
   * →         = next
   */

  useEffect(() => {
    if (!viewerOpen || fullscreenViewerOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setViewerOpen(false)
        return
      }

      if (
        e.key === 'ArrowRight' &&
        images.length > 1
      ) {
        setImageIndex(current => {
          return (current + 1) % images.length
        })
      }

      if (
        e.key === 'ArrowLeft' &&
        images.length > 1
      ) {
        setImageIndex(current => {
          return (
            (current - 1 + images.length) %
            images.length
          )
        })
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [
    viewerOpen,
    fullscreenViewerOpen,
    images.length,
  ])

  /*
   * ============================================================
   * FULLSCREEN KEYBOARD CONTROLS
   * ============================================================
   *
   * ESC       = return to large product card
   * ←         = previous image
   * →         = next image
   */

  useEffect(() => {
    if (!fullscreenViewerOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setFullscreenViewerOpen(false)
        return
      }

      if (
        e.key === 'ArrowRight' &&
        images.length > 1
      ) {
        setFullscreenImageIndex(current => {
          return (current + 1) % images.length
        })
      }

      if (
        e.key === 'ArrowLeft' &&
        images.length > 1
      ) {
        setFullscreenImageIndex(current => {
          return (
            (current - 1 + images.length) %
            images.length
          )
        })
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [
    fullscreenViewerOpen,
    images.length,
  ])

  /*
   * ============================================================
   * PREVENT BACKGROUND SCROLL
   * ============================================================
   */

  useEffect(() => {
    if (!viewerOpen && !fullscreenViewerOpen) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [
    viewerOpen,
    fullscreenViewerOpen,
  ])

  /*
   * ============================================================
   * SHOW GESTURE HINTS
   * ============================================================
   *
   * Hints appear briefly when the large product card opens.
   */

  useEffect(() => {
    if (!viewerOpen || images.length <= 1) {
      setShowGestureHints(false)
      return
    }

    setShowGestureHints(true)

    if (gestureHintTimer.current) {
      window.clearTimeout(
        gestureHintTimer.current
      )
    }

    gestureHintTimer.current =
      window.setTimeout(() => {
        setShowGestureHints(false)
      }, 2200)

    return () => {
      if (gestureHintTimer.current) {
        window.clearTimeout(
          gestureHintTimer.current
        )
      }
    }
  }, [viewerOpen, images.length])

  /*
   * ============================================================
   * OPEN LARGE PRODUCT CARD
   * ============================================================
   */

  function openViewer() {
    const startingIndex = Math.min(
      cardImageIndex,
      Math.max(images.length - 1, 0)
    )

    setImageIndex(startingIndex)
    setViewerOpen(true)
  }

  function closeViewer() {
    setViewerOpen(false)
    setDragOffsetY(0)
  }

  /*
   * ============================================================
   * LARGE VIEWER IMAGE CONTROLS
   * ============================================================
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

  function nextImage(e) {
    e?.stopPropagation()

    if (images.length <= 1) return

    setImageIndex(current => {
      return (current + 1) % images.length
    })
  }

  /*
   * ============================================================
   * OPEN FULLSCREEN IMAGE VIEWER
   * ============================================================
   *
   * It starts with the image currently visible
   * in the large product card.
   */

  function openFullscreenViewer(e) {
    e?.stopPropagation()

    setFullscreenImageIndex(imageIndex)
    setFullscreenViewerOpen(true)
  }

  function closeFullscreenViewer(e) {
    e?.stopPropagation()

    /*
     * Return to the large product card.
     *
     * Also keep the same image selected when
     * returning from fullscreen.
     */
    setImageIndex(fullscreenImageIndex)
    setFullscreenViewerOpen(false)
  }

  /*
   * ============================================================
   * FULLSCREEN IMAGE CONTROLS
   * ============================================================
   */

  function previousFullscreenImage(e) {
    e?.stopPropagation()

    if (images.length <= 1) return

    setFullscreenImageIndex(current => {
      return (
        (current - 1 + images.length) %
        images.length
      )
    })
  }

  function nextFullscreenImage(e) {
    e?.stopPropagation()

    if (images.length <= 1) return

    setFullscreenImageIndex(current => {
      return (current + 1) % images.length
    })
  }

  /*
   * ============================================================
   * LARGE CARD TOUCH START
   * ============================================================
   */

  function handleTouchStart(e) {
    if (!viewerOpen || fullscreenViewerOpen) {
      return
    }

    /*
     * Don't interfere with buttons.
     */
    /*
 * Ignore normal buttons, but allow gestures
 * when the touch starts on the product image.
 */
if (
  e.target.closest('button') &&
  !e.target.closest('.product-viewer-image-button')
) {
  return
}

    /*
     * The image itself has its own click action,
     * but swiping it should still work.
     */
    const touch = e.touches[0]

    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY

    touchDirection.current = null
    isTouching.current = true
  }

  /*
   * ============================================================
   * LARGE CARD TOUCH MOVE
   * ============================================================
   */

  function handleTouchMove(e) {
    if (
      !isTouching.current ||
      fullscreenViewerOpen
    ) {
      return
    }

    const touch = e.touches[0]

    const deltaX =
      touch.clientX -
      touchStartX.current

    const deltaY =
      touch.clientY -
      touchStartY.current

    /*
     * Determine horizontal vs vertical gesture.
     */
    if (!touchDirection.current) {
      const distance = Math.sqrt(
        deltaX * deltaX +
        deltaY * deltaY
      )

      if (distance < 8) return

      if (
        Math.abs(deltaX) >
        Math.abs(deltaY)
      ) {
        touchDirection.current =
          'horizontal'
      } else {
        touchDirection.current =
          'vertical'
      }
    }

    /*
     * Horizontal:
     * just detect the swipe.
     */
    if (
      touchDirection.current ===
      'horizontal'
    ) {
      if (e.cancelable) {
        e.preventDefault()
      }

      return
    }

    /*
     * Vertical:
     * drag the large card downward.
     */
    if (
      touchDirection.current ===
      'vertical'
    ) {
      if (deltaY > 0) {
        if (e.cancelable) {
          e.preventDefault()
        }

        const limitedOffset = Math.min(
          deltaY,
          window.innerHeight * 0.8
        )

        setDragOffsetY(limitedOffset)
      } else {
        setDragOffsetY(0)
      }
    }
  }

  /*
   * ============================================================
   * LARGE CARD TOUCH END
   * ============================================================
   */

  function handleTouchEnd(e) {
    if (
      !isTouching.current ||
      fullscreenViewerOpen
    ) {
      return
    }

    const touch =
      e.changedTouches?.[0]

    if (!touch) {
      isTouching.current = false
      touchDirection.current = null
      setDragOffsetY(0)
      return
    }

    const deltaX =
      touch.clientX -
      touchStartX.current

    const deltaY =
      touch.clientY -
      touchStartY.current

    /*
     * ==========================================================
     * HORIZONTAL SWIPE
     * ==========================================================
     */

    if (
      touchDirection.current ===
      'horizontal'
    ) {
      const swipeThreshold = 50

      if (
        Math.abs(deltaX) >=
        swipeThreshold
      ) {
        if (deltaX < 0) {
          nextImage()
        } else {
          previousImage()
        }
      }
    }

    /*
     * ==========================================================
     * VERTICAL PULL DOWN
     * ==========================================================
     */

    if (
      touchDirection.current ===
      'vertical'
    ) {
      const closeThreshold =
        Math.min(
          160,
          window.innerHeight * 0.2
        )

      if (
        deltaY >= closeThreshold
      ) {
        /*
         * Animate card off-screen.
         */
        setDragOffsetY(
          window.innerHeight
        )

        window.setTimeout(() => {
          setViewerOpen(false)
          setDragOffsetY(0)
        }, 180)
      } else {
        /*
         * Not far enough:
         * snap back.
         */
        setDragOffsetY(0)
      }
    }

    isTouching.current = false
    touchDirection.current = null
  }

  /*
   * ============================================================
   * FULLSCREEN TOUCH START
   * ============================================================
   */

  function handleFullscreenTouchStart(e) {
    if (!fullscreenViewerOpen) return

    /*
     * Don't interfere with the close button.
     */
    if (e.target.closest('button')) {
      return
    }

    const touch = e.touches[0]

    fullscreenTouchStartX.current =
      touch.clientX

    fullscreenTouchStartY.current =
      touch.clientY

    fullscreenTouchDirection.current =
      null

    fullscreenIsTouching.current = true
  }

  /*
   * ============================================================
   * FULLSCREEN TOUCH MOVE
   * ============================================================
   */

  function handleFullscreenTouchMove(e) {
    if (!fullscreenIsTouching.current) {
      return
    }

    const touch = e.touches[0]

    const deltaX =
      touch.clientX -
      fullscreenTouchStartX.current

    const deltaY =
      touch.clientY -
      fullscreenTouchStartY.current

    /*
     * Determine gesture direction.
     */
    if (!fullscreenTouchDirection.current) {
      const distance = Math.sqrt(
        deltaX * deltaX +
        deltaY * deltaY
      )

      if (distance < 8) return

      if (
        Math.abs(deltaX) >
        Math.abs(deltaY)
      ) {
        fullscreenTouchDirection.current =
          'horizontal'
      } else {
        fullscreenTouchDirection.current =
          'vertical'
      }
    }

    /*
     * Fullscreen viewer is intended for
     * horizontal image swiping.
     */
    if (
      fullscreenTouchDirection.current ===
      'horizontal'
    ) {
      if (e.cancelable) {
        e.preventDefault()
      }
    }
  }

  /*
   * ============================================================
   * FULLSCREEN TOUCH END
   * ============================================================
   */

  function handleFullscreenTouchEnd(e) {
    if (!fullscreenIsTouching.current) {
      return
    }

    const touch =
      e.changedTouches?.[0]

    if (!touch) {
      fullscreenIsTouching.current = false
      fullscreenTouchDirection.current =
        null
      return
    }

    const deltaX =
      touch.clientX -
      fullscreenTouchStartX.current

    /*
     * Horizontal swipe only.
     */
    if (
      fullscreenTouchDirection.current ===
      'horizontal'
    ) {
      const swipeThreshold = 50

      if (
        Math.abs(deltaX) >=
        swipeThreshold
      ) {
        if (deltaX < 0) {
          nextFullscreenImage()
        } else {
          previousFullscreenImage()
        }
      }
    }

    fullscreenIsTouching.current = false
    fullscreenTouchDirection.current =
      null
  }

  /*
   * ============================================================
   * CHANGE VARIANT
   * ============================================================
   */

  function handleVariantChange(index) {
    setVariantIdx(index)
    setImageIndex(0)
    setCardImageIndex(0)
    setFullscreenImageIndex(0)
  }

  /*
   * ============================================================
   * CURRENT SMALL CARD IMAGE
   * ============================================================
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

      {viewerOpen && !fullscreenViewerOpen && (
        <div
          className="product-viewer-overlay"
          onClick={closeViewer}
        >
          <div
            className="product-viewer"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateY(${dragOffsetY}px)`,
              transition:
                isTouching.current
                  ? 'none'
                  : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* =================================================
                GESTURE HINTS
            ================================================= */}

            {showGestureHints &&
              images.length > 1 && (
                <>
                  <div className="product-gesture-hint product-gesture-hint-swipe">
                    <span>←</span>
                    <span>
                      Swipe left or right to view photos
                    </span>
                    <span>→</span>
                  </div>

                  <div className="product-gesture-hint product-gesture-hint-close">
                    <span>↓</span>
                    <span>
                      Pull down to close
                    </span>
                  </div>
                </>
              )}

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
                <button
                  type="button"
                  className="product-viewer-image-button"
                  onClick={openFullscreenViewer}
                  aria-label="Open full screen image viewer"
                >
                  <ImageElement
                    key={images[imageIndex]}
                    src={images[imageIndex]}
                    alt={product.name}
                    className="product-viewer-image"
                  />
                </button>
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
                  Swipe left or right to change photos
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          FULLSCREEN IMAGE VIEWER
      ========================================================= */}

      {fullscreenViewerOpen && (
        <div
          className="product-fullscreen-viewer"
          onClick={closeFullscreenViewer}
        >
          <div
            className="product-fullscreen-inner"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleFullscreenTouchStart}
            onTouchMove={handleFullscreenTouchMove}
            onTouchEnd={handleFullscreenTouchEnd}
          >
            {/* Fullscreen close button */}
            <button
              type="button"
              onClick={closeFullscreenViewer}
              className="product-fullscreen-close"
              aria-label="Close full screen image viewer"
            >
              ✕
            </button>

            {/* Fullscreen image */}
            {images.length > 0 && (
              <img
                key={images[fullscreenImageIndex]}
                src={optimizeImage(
                  images[fullscreenImageIndex],
                  1800
                )}
                alt={product.name}
                className="product-fullscreen-image"
                draggable="false"
              />
            )}

            {/* Fullscreen previous */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={previousFullscreenImage}
                className="product-fullscreen-arrow product-fullscreen-arrow-left"
                aria-label="Previous photo"
              >
                ‹
              </button>
            )}

            {/* Fullscreen next */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={nextFullscreenImage}
                className="product-fullscreen-arrow product-fullscreen-arrow-right"
                aria-label="Next photo"
              >
                ›
              </button>
            )}

            {/* Fullscreen counter */}
            {images.length > 1 && (
              <div className="product-fullscreen-counter">
                {fullscreenImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Fullscreen swipe hint */}
            {images.length > 1 && (
              <div className="product-fullscreen-swipe-hint">
                ← Swipe to browse photos →
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}