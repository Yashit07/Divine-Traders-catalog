import React, { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'

export default function SharedCatalog({
  products,
  onClose,
}) {
  const selectedProducts = products || []

  const [activeIndex, setActiveIndex] = useState(0)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchActive = useRef(false)
  const touchDirection = useRef(null)

  /*
   * Keep active product valid if products change.
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
   * Animate the sheet upward after it mounts.
   */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSheetVisible(true)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  /*
   * Prevent background page scrolling while
   * the shared catalog is open.
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
   * Close with ESC.
   */
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        closeCatalog()
      }

      if (
        e.key === 'ArrowLeft' &&
        selectedProducts.length > 1
      ) {
        setActiveIndex(current =>
          current === 0
            ? selectedProducts.length - 1
            : current - 1
        )
      }

      if (
        e.key === 'ArrowRight' &&
        selectedProducts.length > 1
      ) {
        setActiveIndex(current =>
          (current + 1) %
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
  }, [selectedProducts.length])

  function closeCatalog() {
    /*
     * First animate downward.
     * Then actually remove the component.
     */
    setSheetVisible(false)
    setDragOffset(0)

    window.setTimeout(() => {
      onClose?.()
    }, 280)
  }

  function previousProduct(e) {
    e?.stopPropagation()

    if (selectedProducts.length <= 1) return

    setActiveIndex(current =>
      current === 0
        ? selectedProducts.length - 1
        : current - 1
    )
  }

  function nextProduct(e) {
    e?.stopPropagation()

    if (selectedProducts.length <= 1) return

    setActiveIndex(current =>
      (current + 1) %
      selectedProducts.length
    )
  }

  /*
   * ============================================================
   * PRODUCT SWIPE
   * ============================================================
   *
   * Swipe left  -> next product
   * Swipe right -> previous product
   *
   * We only listen to the shared catalog stage.
   * ProductCard's own full-screen image viewer is above this
   * layer, so its image swipe continues working normally.
   */
  function handleTouchStart(e) {
    /*
     * Don't start product swiping when touching buttons.
     */
    if (e.target.closest('button')) {
      return
    }

    const touch = e.touches?.[0]

    if (!touch) return

    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchDirection.current = null
    touchActive.current = true
  }

  function handleTouchMove(e) {
    if (!touchActive.current) return

    const touch = e.touches?.[0]

    if (!touch) return

    const deltaX =
      touch.clientX - touchStartX.current

    const deltaY =
      touch.clientY - touchStartY.current

    /*
     * Wait until the finger has moved enough
     * before deciding direction.
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
     * Horizontal = product navigation.
     */
    if (
      touchDirection.current ===
      'horizontal'
    ) {
      if (e.cancelable) {
        e.preventDefault()
      }
    }

    /*
     * Vertical = don't drag the sheet.
     *
     * The ProductCard itself owns the vertical
     * pull-down gesture when its large viewer is open.
     */
  }

  function handleTouchEnd(e) {
    if (!touchActive.current) return

    const touch =
      e.changedTouches?.[0]

    if (!touch) {
      touchActive.current = false
      touchDirection.current = null
      return
    }

    const deltaX =
      touch.clientX -
      touchStartX.current

    const deltaY =
      touch.clientY -
      touchStartY.current

    /*
     * Only navigate products for a clear
     * horizontal swipe.
     */
    if (
      touchDirection.current ===
      'horizontal'
    ) {
      const threshold = 55

      if (
        Math.abs(deltaX) >= threshold
      ) {
        if (deltaX < 0) {
          nextProduct()
        } else {
          previousProduct()
        }
      }
    }

    touchActive.current = false
    touchDirection.current = null
  }

  /*
   * Empty catalog state.
   */
  if (selectedProducts.length === 0) {
    return (
      <>
        <style>
          {`
            @keyframes sharedCatalogBackdropIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes sharedCatalogSheetIn {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
          `}
        </style>

        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(45, 28, 24, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation:
              'sharedCatalogBackdropIn 220ms ease-out',
            paddingTop:
              'env(safe-area-inset-top)',
            paddingBottom:
              'env(safe-area-inset-bottom)',
          }}
          onClick={closeCatalog}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '760px',
              maxHeight:
                'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
              background:
                'linear-gradient(145deg, #5b4039, #49342f)',
              borderTopLeftRadius: '32px',
              borderTopRightRadius: '32px',
              boxShadow:
                '0 -20px 60px rgba(0,0,0,0.35)',
              padding:
                '14px 18px 24px',
              paddingBottom:
                'calc(24px + env(safe-area-inset-bottom))',
              transform:
                sheetVisible
                  ? `translateY(${dragOffset}px)`
                  : 'translateY(100%)',
              transition:
                touchActive.current
                  ? 'none'
                  : 'transform 280ms cubic-bezier(0.16,1,0.3,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: '44px',
                height: '5px',
                borderRadius: '999px',
                background:
                  'rgba(255,255,255,0.45)',
                margin:
                  '0 auto 18px',
              }}
            />

            <button
              type="button"
              onClick={closeCatalog}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                border:
                  '1px solid rgba(255,255,255,0.25)',
                background:
                  'rgba(255,255,255,0.06)',
                color: 'white',
                fontSize: '28px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <div
              style={{
                textAlign: 'center',
                color: 'white',
                paddingTop: '8px',
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-rose-300">
                Selected Products
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-black mt-1">
                Your Product Catalog
              </h2>

              <div
                style={{
                  marginTop: '8px',
                  opacity: 0.7,
                  fontSize: '12px',
                }}
              >
                Catalog unavailable
              </div>
            </div>

            <div
              style={{
                marginTop: '28px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              <div className="text-5xl mb-4">
                🌸
              </div>

              <p className="text-sm">
                These products are no longer available.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  const activeProduct =
    selectedProducts[activeIndex]

  return (
    <>
      <style>
        {`
          @keyframes sharedCatalogBackdropIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @media (max-width: 767px) {
            .shared-catalog-sheet {
              width: 100% !important;
              max-width: none !important;
              border-top-left-radius: 30px !important;
              border-top-right-radius: 30px !important;
            }
          }
        `}
      </style>

      {/* ========================================================
          BACKDROP
      ======================================================== */}

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background:
            'rgba(43, 28, 24, 0.76)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          overflow: 'hidden',
          animation:
            'sharedCatalogBackdropIn 220ms ease-out',
          paddingTop:
            'env(safe-area-inset-top)',
          paddingBottom:
            'env(safe-area-inset-bottom)',
        }}
        onClick={closeCatalog}
      >

        {/* ======================================================
            BOTTOM SHEET
        ====================================================== */}

        <div
          className="shared-catalog-sheet"
          style={{
            position: 'relative',
            width: 'min(100%, 900px)',

            /*
             * THIS is the important part:
             * the sheet is anchored to the bottom.
             */
            marginTop: 'auto',

            maxHeight:
              'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',

            overflowY: 'auto',
            overflowX: 'hidden',

            background:
              'linear-gradient(145deg, #62443d 0%, #4b3732 100%)',

            borderTopLeftRadius: '34px',
            borderTopRightRadius: '34px',

            boxShadow:
              '0 -25px 80px rgba(0,0,0,0.42)',

            paddingTop: '12px',

            paddingLeft: '14px',
            paddingRight: '14px',

            paddingBottom:
              'calc(22px + env(safe-area-inset-bottom))',

            transform:
              sheetVisible
                ? `translateY(${dragOffset}px)`
                : 'translateY(100%)',

            transition:
              touchActive.current
                ? 'none'
                : 'transform 300ms cubic-bezier(0.16,1,0.3,1)',

            overscrollBehavior:
              'contain',

            WebkitOverflowScrolling:
              'touch',
          }}
          onClick={e => e.stopPropagation()}
        >

          {/* ====================================================
              DRAG HANDLE
          ==================================================== */}

          <div
            style={{
              width: '46px',
              height: '5px',
              borderRadius: '999px',
              background:
                'rgba(255,255,255,0.42)',
              margin:
                '0 auto 12px',
            }}
          />

          {/* ====================================================
              CLOSE BUTTON
          ==================================================== */}

          <button
            type="button"
            onClick={closeCatalog}
            aria-label="Close shared catalog"
            style={{
              position: 'absolute',
              top: '16px',
              right: '14px',

              width: '58px',
              height: '58px',

              borderRadius: '50%',

              border:
                '1px solid rgba(255,255,255,0.28)',

              background:
                'rgba(255,255,255,0.04)',

              color: 'white',

              fontSize: '29px',
              fontWeight: 300,

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              cursor: 'pointer',

              zIndex: 20,
            }}
          >
            ✕
          </button>

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div
            style={{
              textAlign: 'center',
              color: 'white',
              padding:
                '2px 70px 0',
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-rose-300">
              Selected Products
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-black mt-1">
              Your Product Catalog
            </h2>

            <div
              style={{
                fontSize: '12px',
                marginTop: '5px',
                color:
                  'rgba(255,255,255,0.72)',
              }}
            >
              {activeIndex + 1} of{' '}
              {selectedProducts.length}
            </div>
          </div>

          {/* ====================================================
              PRODUCT AREA
          ==================================================== */}

          <div
            style={{
              position: 'relative',
              width: '100%',
              marginTop: '18px',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              minHeight: '0',
            }}
          >

            {/* LEFT ARROW */}

            {selectedProducts.length > 1 && (
              <button
                type="button"
                onClick={previousProduct}
                aria-label="Previous product"
                style={{
                  position: 'absolute',
                  left: '-2px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',

                  width: '50px',
                  height: '50px',

                  borderRadius: '50%',
                  border:
                    '1px solid rgba(255,255,255,0.55)',

                  background:
                    'rgba(255,255,255,0.96)',

                  color: '#ad4568',

                  fontSize: '34px',
                  lineHeight: 1,

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  zIndex: 10,

                  boxShadow:
                    '0 6px 20px rgba(0,0,0,0.18)',

                  cursor: 'pointer',
                }}
              >
                ‹
              </button>
            )}

            {/* ==================================================
                PRODUCT CARD
            ================================================== */}

            <div
              key={String(
                activeProduct.id
              )}
              style={{
                width: 'min(100%, 720px)',
                maxWidth: '720px',

                /*
                 * IMPORTANT:
                 * ProductCard is contained inside the sheet.
                 * Its own full-screen viewer still escapes
                 * this container because it uses fixed positioning.
                 */
                position: 'relative',

                touchAction:
                  'pan-y pinch-zoom',

                animation:
                  'sharedCatalogProductIn 260ms ease-out',
              }}
              onTouchStart={
                handleTouchStart
              }
              onTouchMove={
                handleTouchMove
              }
              onTouchEnd={
                handleTouchEnd
              }
            >
              <ProductCard
                product={activeProduct}                
                editMode={false}
                inWishlist={false}
                onToggleWishlist={() => {}}
              />
            </div>

            {/* RIGHT ARROW */}

            {selectedProducts.length > 1 && (
              <button
                type="button"
                onClick={nextProduct}
                aria-label="Next product"
                style={{
                  position: 'absolute',
                  right: '-2px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',

                  width: '50px',
                  height: '50px',

                  borderRadius: '50%',
                  border:
                    '1px solid rgba(255,255,255,0.55)',

                  background:
                    'rgba(255,255,255,0.96)',

                  color: '#ad4568',

                  fontSize: '34px',
                  lineHeight: 1,

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  zIndex: 10,

                  boxShadow:
                    '0 6px 20px rgba(0,0,0,0.18)',

                  cursor: 'pointer',
                }}
              >
                ›
              </button>
            )}
          </div>

          {/* ====================================================
              PRODUCT DOTS
          ==================================================== */}

          {selectedProducts.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '18px',
              }}
            >
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
                    aria-label={`View product ${index + 1}`}
                    style={{
                      width:
                        index === activeIndex
                          ? '38px'
                          : '10px',

                      height: '10px',

                      borderRadius:
                        '999px',

                      border: 'none',

                      background:
                        index ===
                        activeIndex
                          ? '#e7b26e'
                          : 'rgba(255,255,255,0.42)',

                      padding: 0,

                      transition:
                        'all 220ms ease',

                      cursor:
                        'pointer',
                    }}
                  />
                )
              )}
            </div>
          )}

          {/* ====================================================
              SWIPE INSTRUCTION
          ==================================================== */}

          {selectedProducts.length > 1 && (
            <div
              style={{
                textAlign: 'center',
                color:
                  'rgba(255,255,255,0.72)',
                fontSize: '12px',
                marginTop: '12px',
                marginBottom: '2px',
                userSelect: 'none',
              }}
            >
              ← Swipe left or right to browse products →
            </div>
          )}
        </div>
      </div>
    </>
  )
}