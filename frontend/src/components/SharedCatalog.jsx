import React, { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'

export default function SharedCatalog({
  products,
  showPrices,
  onClose,
}) {
  const selectedProducts = Array.isArray(products)
    ? products
    : []

  const [activeIndex, setActiveIndex] = useState(0)

  /*
   * ============================================================
   * SWIPE BETWEEN PRODUCTS
   * ============================================================
   */
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isTouching = useRef(false)

  /*
   * ============================================================
   * KEEP INDEX VALID
   * ============================================================
   */
  useEffect(() => {
    if (
      selectedProducts.length > 0 &&
      activeIndex >= selectedProducts.length
    ) {
      setActiveIndex(0)
    }
  }, [activeIndex, selectedProducts.length])

  /*
   * ============================================================
   * KEYBOARD CONTROLS
   * ============================================================
   *
   * ← previous product
   * → next product
   * ESC close catalog
   */
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }

      if (
        selectedProducts.length <= 1
      ) {
        return
      }

      if (e.key === 'ArrowRight') {
        setActiveIndex(current =>
          (current + 1) %
          selectedProducts.length
        )
      }

      if (e.key === 'ArrowLeft') {
        setActiveIndex(current =>
          (current - 1 +
            selectedProducts.length) %
          selectedProducts.length
        )
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
    selectedProducts.length,
    onClose,
  ])

  /*
   * ============================================================
   * PREVENT PAGE SCROLL
   * ============================================================
   */
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [])

  /*
   * ============================================================
   * PREVIOUS PRODUCT
   * ============================================================
   */
  function previousProduct(e) {
    e?.stopPropagation()

    if (
      selectedProducts.length <= 1
    ) {
      return
    }

    setActiveIndex(current =>
      current === 0
        ? selectedProducts.length - 1
        : current - 1
    )
  }

  /*
   * ============================================================
   * NEXT PRODUCT
   * ============================================================
   */
  function nextProduct(e) {
    e?.stopPropagation()

    if (
      selectedProducts.length <= 1
    ) {
      return
    }

    setActiveIndex(current =>
      (current + 1) %
      selectedProducts.length
    )
  }

  /*
   * ============================================================
   * TOUCH START
   * ============================================================
   */
  function handleTouchStart(e) {
    /*
     * Don't start a product swipe when the user
     * touches a button.
     */
    if (
      e.target.closest('button')
    ) {
      return
    }

    const touch =
      e.touches?.[0]

    if (!touch) {
      return
    }

    touchStartX.current =
      touch.clientX

    touchStartY.current =
      touch.clientY

    isTouching.current = true
  }

  /*
   * ============================================================
   * TOUCH END
   * ============================================================
   */
  function handleTouchEnd(e) {
    if (!isTouching.current) {
      return
    }

    const touch =
      e.changedTouches?.[0]

    isTouching.current = false

    if (!touch) {
      return
    }

    const deltaX =
      touch.clientX -
      touchStartX.current

    const deltaY =
      touch.clientY -
      touchStartY.current

    /*
     * Only treat it as a product swipe if
     * horizontal movement is clearly greater
     * than vertical movement.
     */
    if (
      Math.abs(deltaX) <=
      Math.abs(deltaY)
    ) {
      return
    }

    /*
     * Ignore tiny movements.
     */
    if (
      Math.abs(deltaX) < 50
    ) {
      return
    }

    if (deltaX < 0) {
      /*
       * Swipe LEFT
       * → next product
       */
      nextProduct()
    } else {
      /*
       * Swipe RIGHT
       * → previous product
       */
      previousProduct()
    }
  }

  /*
   * ============================================================
   * EMPTY / INVALID CATALOG
   * ============================================================
   */
  if (
    selectedProducts.length === 0
  ) {
    return (
      <div
        className="shared-catalog-overlay"
        onClick={onClose}
      >
        <div
          className="shared-catalog-empty"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            type="button"
            onClick={onClose}
            className="shared-catalog-close"
            aria-label="Close catalog"
          >
            ✕
          </button>

          <div className="text-5xl mb-4">
            🌸
          </div>

          <h2 className="font-display text-2xl font-black text-cocoa-900">
            Catalog unavailable
          </h2>

          <p className="text-sm text-cocoa-500 mt-2">
            We couldn't find the products in
            this catalog.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary mt-5"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    )
  }

  const activeProduct =
    selectedProducts[activeIndex]

  /*
   * ============================================================
   * MAIN SHARED CATALOG
   * ============================================================
   */
  return (
    <div
      className="shared-catalog-overlay"
      onClick={onClose}
    >
      {/* ========================================================
          CLOSE BUTTON
      ======================================================== */}
      <button
        type="button"
        onClick={onClose}
        className="shared-catalog-close"
        aria-label="Close shared catalog"
      >
        ✕
      </button>

      {/* ========================================================
          HEADER
      ======================================================== */}
      <div className="shared-catalog-heading">
        <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-rose-400">
          Selected Products
        </div>

        <h2 className="font-display text-xl sm:text-2xl font-black text-white mt-1">
          Your Product Catalog
        </h2>

        <div className="text-[11px] text-white/70 mt-1">
          {activeIndex + 1} of{' '}
          {selectedProducts.length}
        </div>
      </div>

      {/* ========================================================
          PRODUCT AREA
      ======================================================== */}
      <div
        className="shared-catalog-stage"
        onClick={(e) =>
          e.stopPropagation()
        }
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous */}
        {selectedProducts.length > 1 && (
          <button
            type="button"
            onClick={previousProduct}
            className="shared-catalog-arrow shared-catalog-arrow-left"
            aria-label="Previous product"
          >
            ‹
          </button>
        )}

        {/* ======================================================
            ACTIVE PRODUCT
        ====================================================== */}
        <div
          key={String(
            activeProduct.id
          )}
          className="shared-catalog-product"
        >
          <ProductCard
            product={activeProduct}
            showPrices={showPrices}
            editMode={false}
            inWishlist={false}
            onToggleWishlist={() => {}}
          />
        </div>

        {/* Next */}
        {selectedProducts.length > 1 && (
          <button
            type="button"
            onClick={nextProduct}
            className="shared-catalog-arrow shared-catalog-arrow-right"
            aria-label="Next product"
          >
            ›
          </button>
        )}
      </div>

      {/* ========================================================
          PRODUCT DOTS
      ======================================================== */}
      {selectedProducts.length > 1 && (
        <div className="shared-catalog-dots">
          {selectedProducts.map(
            (product, index) => (
              <button
                key={String(
                  product.id
                )}
                type="button"
                onClick={() =>
                  setActiveIndex(index)
                }
                aria-label={`View product ${
                  index + 1
                }`}
                className={
                  index === activeIndex
                    ? 'shared-catalog-dot active'
                    : 'shared-catalog-dot'
                }
              />
            )
          )}
        </div>
      )}

      {/* ========================================================
          SWIPE INSTRUCTION
      ======================================================== */}
      {selectedProducts.length > 1 && (
        <div className="shared-catalog-hint">
          ← Swipe left or right to browse products →
        </div>
      )}
    </div>
  )
}