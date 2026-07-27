import React, { useState } from 'react'

export default function UnlockModal({ open, onClose, onShowPrices, showingPrices, onEditMode, adminPassword }) {
  const [step, setStep] = useState('choose')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')

  React.useEffect(() => {
    if (open) { setStep('choose'); setPwd(''); setErr('') }
  }, [open])

  if (!open) return null

  function submit(e) {
    e.preventDefault()
    if (pwd.trim() === (adminPassword || '')) onEditMode()
    else setErr('Incorrect password. Try again.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-cocoa-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card-surface rounded-3xl p-6 shadow-hero animate-pop">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ivory-50 hover:bg-white text-rose-500 flex items-center justify-center border border-ivory-200">✕</button>

        {step === 'choose' ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-gold-400 items-center justify-center text-2xl mb-3 shadow-glow">🔐</div>
              <h2 className="font-display text-2xl font-black text-shimmer">Unlock / Admin</h2>
              <p className="text-sm text-cocoa-500 mt-1">Choose what you’d like to do</p>
            </div>

            <div className="space-y-3">
              <button type="button" onClick={() => { onShowPrices(); onClose() }}
                className="w-full text-left p-4 rounded-2xl bg-ivory-50 hover:bg-white border border-ivory-200 hover:border-gold-300 transition-all hover:shadow-soft group">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blush-100 to-gold-100 flex items-center justify-center text-xl group-hover:scale-110 transition">
                    {showingPrices ? '👁️' : '💰'}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-cocoa-900">{showingPrices ? 'Hide Prices' : 'Show Prices'}</div>
                    <div className="text-xs text-cocoa-500">Toggle wholesale prices across the catalog</div>
                  </div>
                  <span className="text-rose-400">→</span>
                </div>
              </button>

              <button type="button" onClick={() => setStep('password')}
                className="w-full text-left p-4 rounded-2xl bg-ivory-50 hover:bg-white border border-ivory-200 hover:border-gold-300 transition-all hover:shadow-soft group">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-100 to-blush-100 flex items-center justify-center text-xl group-hover:scale-110 transition">✏️</div>
                  <div className="flex-1">
                    <div className="font-bold text-cocoa-900">Edit Mode</div>
                    <div className="text-xs text-cocoa-500">Admin only — add, edit or delete products</div>
                  </div>
                  <span className="text-rose-400">→</span>
                </div>
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <div className="text-center mb-5">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-rose-500 items-center justify-center text-2xl mb-3 shadow-glow">🔑</div>
              <h2 className="font-display text-2xl font-black text-shimmer">Admin Password</h2>
              <p className="text-sm text-cocoa-500 mt-1">Enter password to enter Edit Mode</p>
            </div>

            <input type="password" autoFocus value={pwd}
              onChange={(e) => { setPwd(e.target.value); setErr('') }}
              placeholder="Enter admin password" className="input text-center text-lg" />
            {err && <p className="text-red-500 text-xs mt-2 text-center">{err}</p>}

            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setStep('choose')} className="btn-ghost flex-1">← Back</button>
              <button type="submit" className="btn-primary flex-1">Unlock 🔓</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
