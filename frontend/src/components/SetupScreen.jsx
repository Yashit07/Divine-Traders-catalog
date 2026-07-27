import React, { useState } from 'react'
import { SETUP_SQL, supabaseProjectRef } from '../lib/setupSql'

export default function SetupScreen({ errorMessage, onRetry }) {
  const [copied, setCopied] = useState(false)
  const ref = supabaseProjectRef()
  const sqlEditorUrl = ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : 'https://supabase.com/dashboard'
  const storageUrl = ref ? `https://supabase.com/dashboard/project/${ref}/storage/buckets` : 'https://supabase.com/dashboard'

  async function copy() {
    try {
      await navigator.clipboard.writeText(SETUP_SQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: select the textarea
      const ta = document.getElementById('setup-sql-textarea')
      if (ta) { ta.select(); document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2500) }
    }
  }

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 shadow-glow border-2 border-gold-200/60 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blush-400 to-gold-400 items-center justify-center text-3xl mb-3 shadow-glow">🌸</div>
        <h2 className="font-display text-3xl sm:text-4xl font-black bg-gradient-to-r from-blush-500 to-gold-500 bg-clip-text text-transparent">
          One last step!
        </h2>
        <p className="text-gray-700 mt-2 text-sm sm:text-base max-w-xl mx-auto">
          Your Supabase project needs its tables created. This is a <b>one-time 30-second setup</b>, then your 125 seed products will load automatically.
        </p>
      </div>

      {/* Steps */}
      <ol className="space-y-4 max-w-3xl mx-auto">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blush-400 to-gold-400 text-white font-black flex items-center justify-center shadow-sm">1</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Copy the setup SQL below</p>
            <div className="mt-2 relative">
              <textarea
                id="setup-sql-textarea"
                readOnly
                value={SETUP_SQL}
                className="w-full h-40 sm:h-48 p-3 rounded-2xl bg-white/90 border border-white text-xs font-mono text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-gold-300"
              />
              <button
                type="button"
                onClick={copy}
                className={`absolute top-2 right-2 pill text-xs ${copied ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-blush-400 to-gold-400 text-white shadow-soft hover:shadow-glow'}`}
              >
                {copied ? '✓ Copied!' : '📋 Copy SQL'}
              </button>
            </div>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blush-400 to-gold-400 text-white font-black flex items-center justify-center shadow-sm">2</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Open your Supabase SQL editor and paste + run it</p>
            <a
              href={sqlEditorUrl}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary mt-2 inline-flex"
            >
              🚀 Open SQL Editor →
            </a>
            <p className="text-xs text-gray-500 mt-1.5">Paste into the editor and click the green <b>Run</b> button (or press <kbd className="px-1.5 py-0.5 bg-white/70 border border-white rounded text-[10px]">Ctrl/Cmd + Enter</kbd>).</p>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blush-400 to-gold-400 text-white font-black flex items-center justify-center shadow-sm">3</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Confirm the storage bucket is public <span className="text-gray-500 font-normal">(usually already done by the SQL above)</span></p>
            <a
              href={storageUrl}
              target="_blank" rel="noopener noreferrer"
              className="btn-ghost mt-2 inline-flex text-sm"
            >
              📦 Open Storage →
            </a>
            <p className="text-xs text-gray-500 mt-1.5">Check that a bucket named <code className="bg-white/70 px-1.5 py-0.5 rounded">product-images</code> exists and is <b>Public</b>.</p>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-gold-400 text-white font-black flex items-center justify-center shadow-sm">✓</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Come back and click below — your 125 products will load instantly</p>
            <button type="button" data-testid="retry-catalog" onClick={onRetry} className="btn-primary mt-2 text-base">
              🎉 I&rsquo;ve run it — Load my catalog
            </button>
          </div>
        </li>
      </ol>

      {errorMessage && (
        <details className="mt-6 max-w-3xl mx-auto">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-blush-500">Technical error details</summary>
          <pre className="mt-2 text-[10px] bg-white/70 rounded-xl p-3 overflow-x-auto text-gray-700">{errorMessage}</pre>
        </details>
      )}
    </div>
  )
}
