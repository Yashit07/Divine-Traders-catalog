import React, { useState } from 'react'
import { adminLogin } from '../lib/db'
import { toast } from '../lib/toast'

export default function UnlockModal({ open, onClose, showingPrices, onShowPrices, onEditMode }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await adminLogin(password)
      toast.success('Admin access granted ✨')
      onEditMode()
      setPassword('')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Incorrect admin password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cocoa-500 hover:text-rose-500 font-bold text-lg"
        >
          ✕
        </button>

        <h3 className="font-display text-2xl font-bold text-cocoa-900 mb-2">Admin / Options</h3>
        <p className="text-cocoa-500 text-sm mb-6">Toggle display options or authenticate to enter edit mode.</p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => { onShowPrices(); onClose() }}
            className="w-full py-3 px-4 rounded-2xl bg-ivory-100 hover:bg-ivory-200 text-cocoa-900 font-semibold text-sm transition flex items-center justify-between border border-ivory-200"
          >
            <span>{showingPrices ? '🙈 Hide Prices' : '👁️ Show Wholesale Prices'}</span>
            <span className="text-xs bg-white px-2 py-1 rounded-lg border border-ivory-300">Toggle</span>
          </button>

          <hr className="border-ivory-200 my-4" />

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-cocoa-600">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to edit..."
              className="w-full px-4 py-3 rounded-xl bg-ivory-50 border border-ivory-200 text-sm outline-none focus:border-gold-400 focus:bg-white transition"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-gold-400 text-white font-bold text-sm shadow-md hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Unlock Edit Mode 🔓'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
