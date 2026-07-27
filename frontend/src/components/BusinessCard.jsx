import React from 'react'

function isImageEmblem(v) {
  if (!v) return false
  return /^(https?:|data:image)/i.test(String(v))
}

export default function BusinessCard({ branding, onBrowse, onShare, wishlistCount, onOpenWishlist }) {
  const b = branding || {}
  const phone = (b.phone1 || '').replace(/[^0-9]/g, '')
  const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent('Hi Divine Traders, I saw your wholesale catalog.')}` : '#'
  const addressQ = encodeURIComponent(b.address || '')
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${addressQ}`
  const emblemImg = isImageEmblem(b.emblem)

  return (
    <section className="relative overflow-hidden min-h-screen sm:min-h-0 flex items-center py-6 sm:py-10">
      {/* soft decorations */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-16 w-80 h-80 rounded-full bg-gold-100/70 blur-3xl" />
        <div className="absolute top-10 -right-24 w-96 h-96 rounded-full bg-rose-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-blush-100/60 blur-3xl" />
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-8">
        <div className="card-surface rounded-[32px] sm:rounded-[36px] shadow-hero relative overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-rose-500 via-gold-400 to-blush-300" />

          <div className="px-5 sm:px-10 pt-7 pb-6 text-center">
            {/* Emblem */}
            <div className="relative inline-block">
              <div className="emblem-ring absolute -inset-1 rounded-full blur-[2px] opacity-70" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-rose-500 via-blush-400 to-gold-400 shadow-glow flex items-center justify-center overflow-hidden animate-float">
                {emblemImg ? (
                  <img src={b.emblem} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-black text-white text-4xl sm:text-5xl tracking-tight drop-shadow">
                    {b.emblem || 'DT'}
                  </span>
                )}
              </div>
              <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">✨</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black mt-4 text-shimmer leading-tight">
              {b.business_name || 'Divine Traders'}
            </h1>

            <div className="mt-2">
              <span className="inline-block px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-600 text-xs font-semibold italic">
                “{b.sub_tagline || 'Your Trust, Our Quality'}”
              </span>
            </div>

            <p className="mt-4 text-sm sm:text-base text-cocoa-700 leading-relaxed max-w-md mx-auto">
              {b.tagline || 'We Deals in Wholesale — Cosmetics, FMCG & General Products'}
            </p>

            <div className="flex items-center justify-center gap-2 my-5 sm:my-6">
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
              <span className="text-gold-400">✦</span>
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
            </div>

            {/* Contact row — WhatsApp instead of tel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {b.phone1 && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-ivory-50 border border-ivory-200 rounded-2xl px-4 py-3 hover:bg-white hover:border-gold-300 hover:shadow-soft transition group">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 text-white flex items-center justify-center text-lg shadow-soft group-hover:scale-105 transition">💬</span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-cocoa-500">Chat on WhatsApp</div>
                    <div className="font-bold text-cocoa-900 truncate">{b.phone1}</div>
                  </div>
                </a>
              )}
              {b.address && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-ivory-50 border border-ivory-200 rounded-2xl px-4 py-3 hover:bg-white hover:border-gold-300 hover:shadow-soft transition group">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-rose-400 text-white flex items-center justify-center text-lg shadow-soft group-hover:scale-105 transition">📍</span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-cocoa-500">Visit us</div>
                    <div className="font-semibold text-cocoa-900 text-sm truncate">{b.address}</div>
                  </div>
                </a>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2 items-stretch justify-center">
              <button type="button" onClick={onBrowse} className="btn-primary text-base px-6 flex-1 sm:flex-none">
                🌸 Browse Full Catalog
                <span className="animate-float">↓</span>
              </button>
              <button type="button" onClick={onShare} className="btn-ghost text-sm px-5">
                📤 Share
              </button>
              {wishlistCount > 0 && (
                <button type="button" onClick={onOpenWishlist} className="btn-ghost text-sm px-5 relative">
                  ❤️ Wishlist
                  <span className="ml-1 text-[10px] bg-rose-500 text-white rounded-full px-1.5 py-0.5">{wishlistCount}</span>
                </button>
              )}
            </div>
          </div>

          <div className="px-5 sm:px-10 py-3 border-t border-ivory-200 bg-ivory-50/60 text-center text-[10px] sm:text-[11px] text-cocoa-500 tracking-wider uppercase font-semibold">
            Wholesale means better price — better profit
          </div>
        </div>

        <div className="text-center mt-3 text-cocoa-500 text-xs animate-float">
          Scroll or tap Browse for catalog
        </div>
      </div>
    </section>
  )
}
