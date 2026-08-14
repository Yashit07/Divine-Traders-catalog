import React, { useState } from 'react'
import { createSharedCatalog } from '../lib/db'

function formatPrice(p) {
  if (p === null || p === undefined || p === '') {
    return '₹—'
  }

  const n = Number(p)

  if (Number.isNaN(n)) {
    return '₹—'
  }

  return `₹${n.toLocaleString('en-IN')}`
}

export default function WishlistDrawer({
  open,
  onClose,
  items,
  onRemove,
  onClear,
  phone,
}) {
  const [choiceOpen, setChoiceOpen] = useState(false)
  const [sharing, setSharing] = useState(false)

  if (!open) return null

  /*
   * ============================================================
   * PUBLIC WEBSITE URL
   * ============================================================
   *
   * NEVER use window.location.hostname here because during
   * development it can be:
   *
   * 192.168.x.x:3000
   *
   * Customers cannot open that.
   */
  const publicSiteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  'https://www.divinetraders.biz'

  /*
   * Product names for WhatsApp message.
   */
  const names = items.map(p => p.name)

  const nameLines =
    names.length < 4
      ? names.map(name => `• ${name}`)
      : [
          ...names.slice(0, 4).map(
            name => `• ${name}`
          ),
          `• + ${names.length - 4} more`,
        ]

  /*
   * Create the WhatsApp message AFTER the permanent
   * shared catalog has been created.
   */
  async function createCatalogAndShare() {
    if (!items.length || sharing) return

    setSharing(true)

    try {
      /*
       * Save a snapshot in Supabase.
       *
       * This is what makes the link survive:
       * - product deletion
       * - product editing
       * - catalog reset
       */
      const catalogId =
        await createSharedCatalog(items)

      const catalogUrl =
        `${publicSiteUrl.replace(/\/$/, '')}/?catalog=${catalogId}`

      const message = [
        '🌸 Hi Divine Traders!',
        '',
        'Here are the products you inquired about:',
        '',
        ...nameLines,
        '',
        '📋 View your selected products, images, prices and details here:',
        catalogUrl,
        '',
        'Please share the prices and availability for these products.',
        '',
        'Thank you! ✨',
      ].join('\n')

      const cleanPhone =
        (phone || '').replace(
          /[^0-9]/g,
          ''
        )

      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`

      window.open(
        waUrl,
        '_blank',
        'noopener,noreferrer'
      )
    } catch (error) {
      console.error(error)

      alert(
        'Could not create the catalog link. Please try again.'
      )
    } finally {
      setSharing(false)
    }
  }

  async function shareCatalogDirectly() {
    if (!items.length || sharing) return

    setSharing(true)

    try {
      const catalogId =
        await createSharedCatalog(items)

      const catalogUrl =
        `${publicSiteUrl.replace(/\/$/, '')}/?catalog=${catalogId}`

      const shareText = [
        '🌸 Here are the products you inquired about:',
        '',
        ...nameLines,
        '',
        '📋 Open your selected product catalog:',
      ].join('\n')

      /*
       * Native share on phones.
       */
      if (navigator.share) {
        await navigator.share({
          title: 'Divine Traders Product Catalog',
          text: shareText,
          url: catalogUrl,
        })
      } else if (navigator.clipboard) {
        /*
         * Desktop fallback.
         */
        await navigator.clipboard.writeText(
          catalogUrl
        )

        alert(
          'Catalog link copied! You can now send it to your customer.'
        )
      } else {
        window.prompt(
          'Copy this catalog link:',
          catalogUrl
        )
      }
    } catch (error) {
      /*
       * User cancelling the native share dialog
       * is not an actual error.
       */
      if (error?.name !== 'AbortError') {
        console.error(error)

        alert(
          'Could not create the catalog link. Please try again.'
        )
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-cocoa-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[88vh] flex flex-col card-surface rounded-t-3xl sm:rounded-3xl shadow-hero animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ivory-200 sticky top-0 bg-white/95 backdrop-blur rounded-t-3xl">
          <div>
            <h2 className="font-display text-2xl font-black text-shimmer flex items-center gap-2">
              ♥ My Wishlist
            </h2>

            <p className="text-xs text-cocoa-500">
              {items.length} product
              {items.length === 1 ? '' : 's'} selected
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-ivory-50 hover:bg-white text-rose-500 flex items-center justify-center border border-ivory-200"
          >
            ✕
          </button>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-2">
                🌸
              </div>

              <p className="text-cocoa-500">
                Tap the ♡ icon on any product to add
                it to your wishlist.
              </p>
            </div>
          ) : (
            items.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-ivory-50 border border-ivory-200 rounded-2xl p-2.5"
              >
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border border-ivory-200">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl opacity-60">
                      📷
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-rose-500 truncate">
                      {p.brand}
                    </span>

                    <span className="text-[9px] text-gold-500 uppercase tracking-wider">
                      {p.category}
                    </span>
                  </div>

                  <div className="font-semibold text-cocoa-900 text-sm truncate">
                    {p.name}
                  </div>

                  {p.price !== null &&
                    p.price !== undefined && (
                      <div className="text-xs font-bold text-shimmer">
                        {formatPrice(p.price)}
                      </div>
                    )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onRemove(p.id)
                  }
                  className="w-8 h-8 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-sm flex items-center justify-center border border-ivory-200 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-ivory-200 safe-bottom bg-white/95 backdrop-blur">
            {!choiceOpen ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setChoiceOpen(true)
                  }
                  className="btn-primary w-full justify-center"
                >
                  ♥ Continue
                </button>

                <button
                  type="button"
                  onClick={onClear}
                  className="btn-ghost w-full justify-center text-sm"
                >
                  Clear all
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-rose-500 mb-1">
                  Choose how to send
                </div>

                {/* ALWAYS FIRST */}
                <button
                  type="button"
                  disabled={sharing}
                  onClick={createCatalogAndShare}
                  className="w-full rounded-2xl p-4 text-left bg-gradient-to-r from-rose-500 to-gold-400 text-white shadow-soft transition active:scale-[0.99] disabled:opacity-60"
                >
                  <div className="font-bold text-sm">
                    💬 Send Inquiry on WhatsApp
                  </div>

                  <div className="text-[11px] text-white/85 mt-1">
                    Send your selected products with
                    a permanent catalog link.
                  </div>
                </button>

                <button
                  type="button"
                  disabled={sharing}
                  onClick={shareCatalogDirectly}
                  className="w-full rounded-2xl p-4 text-left bg-ivory-50 border border-ivory-200 text-cocoa-900 transition hover:bg-white disabled:opacity-60"
                >
                  <div className="font-bold text-sm text-rose-500">
                    📋 Send Product Catalog
                  </div>

                  <div className="text-[11px] text-cocoa-500 mt-1">
                    Share the exact selected products
                    with images, prices and details.
                  </div>
                </button>

                <button
                  type="button"
                  disabled={sharing}
                  onClick={() =>
                    setChoiceOpen(false)
                  }
                  className="btn-ghost w-full justify-center text-sm"
                >
                  ← Back
                </button>

                {sharing && (
                  <div className="flex items-center justify-center gap-2 text-[11px] text-cocoa-500 pt-1">
                    <div className="catalog-spinner-ring" />
                    Creating your catalog link…
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}