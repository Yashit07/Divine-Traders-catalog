import React from 'react'

export default function AdminBar({ onAdd, onBranding, onReset, onExport, onExit }) {
  return (
    <div className="sticky top-2 z-30 mb-4">
      <div className="card-surface rounded-2xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2 shadow-soft border-2 border-gold-200">
        <span className="inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-gold-400 text-white text-xs font-bold">
          <span className="w-5 h-5 bg-white/25 rounded-full flex items-center justify-center">✨</span>
          EDIT MODE
        </span>
        <div className="flex-1" />
        <button type="button" onClick={onAdd} className="pill-primary">➕ Add Product</button>
        <button type="button" onClick={onBranding} className="pill-ghost">🎨 Branding</button>
        <button type="button" onClick={onExport} className="pill-ghost">⬇️ Export</button>
        <button type="button" onClick={onReset} className="pill-ghost">↻ Reset</button>
        <button type="button" onClick={onExit} className="pill-ghost">🚪 Exit</button>
      </div>
    </div>
  )
}
