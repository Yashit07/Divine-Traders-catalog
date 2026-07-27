import React from 'react'
import { CATEGORIES, CATEGORY_ICONS } from '../lib/categories'

export default function CategoryTabs({ value, onChange, counts }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x hide-scrollbar">
      {CATEGORIES.map((c) => {
        const active = value === c
        const count = counts?.[c]
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`snap-start whitespace-nowrap pill ${active ? 'cat-active' : 'cat-idle'}`}
          >
            <span>{CATEGORY_ICONS[c] || '🏷️'}</span>
            <span className="font-semibold">{c}</span>
            {typeof count === 'number' && (
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-blush-50 text-rose-500'}`}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
