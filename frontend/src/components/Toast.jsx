import React, { useEffect, useState } from 'react'
import { toast } from '../lib/toast'

const styles = {
  success: 'from-emerald-500 to-emerald-400',
  error:   'from-rose-600 to-rose-500',
  info:    'from-gold-400 to-blush-400',
  loading: 'from-cocoa-500 to-cocoa-700',
}
const icons = { success: '✓', error: '⚠️', info: '✨', loading: '◜' }

export default function ToastStack() {
  const [items, setItems] = useState([])
  useEffect(() => toast._subscribe((e) => {
    if (e.type === 'add') setItems((s) => [...s, e.item])
    else setItems((s) => s.filter(i => i.id !== e.id))
  }), [])

  if (!items.length) return null

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {items.map(i => (
        <div key={i.id}
          className={`pointer-events-auto animate-slide-up flex items-center gap-2 px-4 py-2.5 rounded-full shadow-hero text-white text-sm font-semibold bg-gradient-to-r ${styles[i.kind] || styles.info}`}>
          <span className={i.kind === 'loading' ? 'animate-spin inline-block' : ''}>{icons[i.kind] || '✨'}</span>
          <span className="max-w-[80vw] truncate">{i.message}</span>
        </div>
      ))}
    </div>
  )
}
