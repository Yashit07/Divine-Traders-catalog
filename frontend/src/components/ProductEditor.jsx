import React, { useEffect, useRef, useState } from 'react'
import { uploadImage } from '../lib/db'
import { CATEGORIES } from '../lib/categories'
import { toast } from '../lib/toast'

const DRAFT_KEY = 'dt_product_editor_draft_v2'
function blankVariant() { return { name: '', price: '', image_url: '' } }
function blankForm() {
  return { brand: '', name: '', category: 'Fragrances', description: '', packaging: '', price: '', image_url: '', variants: [] }
}

export default function ProductEditor({ open, initial, onClose, onSave }) {
  const editing = Boolean(initial && initial.id)
  const [form, setForm] = useState(blankForm())
  const [hasVariants, setHasVariants] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)
  const hydrated = useRef(false)

  // Hydrate on open
  useEffect(() => {
    if (!open) { hydrated.current = false; return }
    setError('')
    if (initial) {
      setForm({
        brand: initial.brand || '',
        name: initial.name || '',
        category: initial.category || 'Fragrances',
        description: initial.description || '',
        packaging: initial.packaging || '',
        price: initial.price ?? '',
        image_url: initial.image_url || '',
        variants: (initial.variants || []).map(v => ({ name: v.name || '', price: v.price ?? '', image_url: v.image_url || '' })),
      })
      setHasVariants((initial.variants || []).length > 0)
      setDraftRestored(false)
    } else {
      // Try restore draft (only for new-product flow)
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          const d = JSON.parse(raw)
          if (d && !d.editingId && d.form) {
            setForm({ ...blankForm(), ...d.form })
            setHasVariants(!!d.hasVariants)
            setDraftRestored(true)
          } else { setForm(blankForm()); setHasVariants(false); setDraftRestored(false) }
        } else { setForm(blankForm()); setHasVariants(false); setDraftRestored(false) }
      } catch { /* ignore */ }
    }
    hydrated.current = true
  }, [open, initial])

  // Persist draft for new-product flow only (so a browser refresh can’t nuke the user’s work)
  useEffect(() => {
    if (!open || !hydrated.current) return
    if (initial && initial.id) return // don’t save drafts for edits (they’re persisted server-side)
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ editingId: null, form, hasVariants }))
    } catch { /* ignore */ }
  }, [form, hasVariants, open, initial])

  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } }

  if (!open) return null

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleFile(e, kind, idx) {
    const file = e.target.files?.[0]
    if (!file) return
    const tId = toast.loading('Uploading photo…')
    try {
      setUploading(true); setError('')
      const url = await uploadImage(file)
      if (kind === 'main') setForm(f => ({ ...f, image_url: url }))
      else if (kind === 'variant') {
        setForm(f => { const nv = [...f.variants]; nv[idx] = { ...nv[idx], image_url: url }; return { ...f, variants: nv } })
      }
      toast.dismiss(tId); toast.success('Photo uploaded!')
    } catch (err) {
      toast.dismiss(tId); toast.error('Upload failed — check bucket policies')
      setError(err.message || 'Upload failed.')
    } finally { setUploading(false); e.target.value = '' }
  }

  function addVariant() { setForm(f => ({ ...f, variants: [...f.variants, blankVariant()] })) }
  function updateVariant(i, key, val) {
    setForm(f => { const nv = [...f.variants]; nv[i] = { ...nv[i], [key]: val }; return { ...f, variants: nv } })
  }
  function removeVariant(i) { setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) })) }

  async function submit(e) {
    e.preventDefault()
    if (!form.brand.trim() || !form.name.trim()) { setError('Brand and product name are required'); return }
    setSaving(true); setError('')
    const tId = toast.loading(editing ? 'Saving changes…' : 'Adding product…')
    try {
      const payload = {
        brand: form.brand.trim(),
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim() || null,
        packaging: form.packaging.trim() || null,
        price: hasVariants ? null : (form.price === '' ? null : Number(form.price)),
        image_url: hasVariants ? null : (form.image_url || null),
        variants: hasVariants
          ? form.variants.filter(v => v.name.trim()).map(v => ({
              name: v.name.trim(),
              price: v.price === '' ? null : Number(v.price),
              image_url: v.image_url || null,
            }))
          : [],
      }
      await onSave(payload)
      toast.dismiss(tId); toast.success(editing ? 'Product updated & saved to cloud ✨' : 'Product added to catalog 🌸')
      clearDraft()
      onClose()
    } catch (err) {
      toast.dismiss(tId); toast.error(err.message || 'Save failed')
      setError(err.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  function discardDraft() {
    clearDraft(); setForm(blankForm()); setHasVariants(false); setDraftRestored(false)
    toast.info('Draft discarded')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-cocoa-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto card-surface rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-hero animate-slide-up">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/95 backdrop-blur -mx-5 sm:-mx-6 px-5 sm:px-6 py-2 z-10">
          <h2 className="font-display text-xl sm:text-2xl font-black text-shimmer">
            {editing ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-ivory-50 hover:bg-white text-rose-500 flex items-center justify-center border border-ivory-200">✕</button>
        </div>

        {draftRestored && !editing && (
          <div className="mb-3 flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-2xl px-3 py-2 text-xs text-cocoa-700">
            <span>💾</span>
            <span className="flex-1">We restored an unfinished draft from your last visit.</span>
            <button type="button" onClick={discardDraft} className="font-bold text-rose-500 hover:underline">Discard</button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Brand *</label>
              <input className="input" value={form.brand} onChange={set('brand')} placeholder="e.g. Killer" />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Product Name *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Storm / Cyclone / Wave" />
          </div>

          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={set('description')} placeholder="Short product description" />
          </div>

          <div>
            <label className="label">Packaging</label>
            <input className="input" value={form.packaging} onChange={set('packaging')} placeholder="e.g. Aerosol spray canister" />
          </div>

          <div className="flex items-center gap-3 bg-ivory-50 rounded-2xl px-4 py-3 border border-ivory-200">
            <input id="hasVariants" type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="w-5 h-5 rounded accent-rose-500" />
            <label htmlFor="hasVariants" className="font-medium text-cocoa-700 cursor-pointer text-sm">This product has multiple variants (flavors/shades/sizes)</label>
          </div>

          {!hasVariants ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Price (₹)</label>
                <input className="input" type="number" step="0.01" inputMode="decimal" value={form.price} onChange={set('price')} placeholder="Leave blank for ₹—" />
              </div>
              <div>
                <label className="label">Image</label>
                <div className="flex gap-2">
                  <input className="input" value={form.image_url} onChange={set('image_url')} placeholder="Image URL or upload →" />
                  <label className="btn-ghost cursor-pointer whitespace-nowrap">
                    {uploading ? '…' : '📁'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'main')} />
                  </label>
                </div>
                {form.image_url && <img src={form.image_url} alt="" className="mt-2 w-20 h-20 object-cover rounded-xl border border-ivory-200" />}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="label mb-0">Variants</span>
                <button type="button" onClick={addVariant} className="pill-ghost text-xs">+ Add variant</button>
              </div>
              {form.variants.length === 0 && (
                <p className="text-xs text-cocoa-500 italic">No variants yet. Click “+ Add variant”.</p>
              )}
              {form.variants.map((v, i) => (
                <div key={i} className="bg-ivory-50 border border-ivory-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-500">Variant #{i + 1}</span>
                    <button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className="input" placeholder="Name / Flavor / Shade" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} />
                    <input className="input" type="number" step="0.01" inputMode="decimal" placeholder="Price (₹)" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input className="input" placeholder="Image URL or upload →" value={v.image_url} onChange={(e) => updateVariant(i, 'image_url', e.target.value)} />
                    <label className="btn-ghost cursor-pointer whitespace-nowrap">
                      {uploading ? '…' : '📁'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'variant', i)} />
                    </label>
                    {v.image_url && <img src={v.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-ivory-200" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white/95 backdrop-blur -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 border-t border-ivory-200">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
              {saving ? 'Saving…' : (editing ? '💾 Save Changes' : '➕ Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
