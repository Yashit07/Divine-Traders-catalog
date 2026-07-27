import React, { useEffect, useState } from 'react'
import { toast } from '../lib/toast'
import { uploadImage } from '../lib/db'

function isImageEmblem(v) { return !!v && /^(https?:|data:image)/i.test(String(v)) }

export default function BrandingEditor({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState({
    business_name: '', emblem: '', tagline: '', sub_tagline: '',
    phone1: '', address: '', admin_password: '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) setForm({
      business_name: initial.business_name || '',
      emblem: initial.emblem || '',
      tagline: initial.tagline || '',
      sub_tagline: initial.sub_tagline || '',
      phone1: initial.phone1 || '',
      address: initial.address || '',
      admin_password: initial.admin_password || '',
    })
  }, [initial, open])

  if (!open) return null

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleEmblemFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    const tId = toast.loading('Uploading logo…')
    try {
      setUploading(true); setError('')
      const url = await uploadImage(file, 'branding')
      setForm(f => ({ ...f, emblem: url }))
      toast.dismiss(tId); toast.success('Logo uploaded!')
    } catch (err) {
      toast.dismiss(tId); toast.error('Upload failed')
      setError(err.message || 'Upload failed.')
    } finally { setUploading(false); e.target.value = '' }
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    const tId = toast.loading('Saving branding…')
    try {
      await onSave({ ...form, phone2: null })
      toast.dismiss(tId); toast.success('Branding saved ✨')
      onClose()
    } catch (err) {
      toast.dismiss(tId); toast.error(err.message || 'Failed to save branding')
      setError(err.message || 'Failed to save branding')
    } finally { setSaving(false) }
  }

  const emblemIsImage = isImageEmblem(form.emblem)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-cocoa-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[95vh] overflow-y-auto card-surface rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-hero animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-black text-shimmer">🎨 Edit Branding</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-ivory-50 hover:bg-white text-rose-500 flex items-center justify-center border border-ivory-200">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Business Name</label>
            <input className="input" value={form.business_name} onChange={set('business_name')} />
          </div>

          {/* Emblem: text OR logo image */}
          <div>
            <label className="label">Emblem / Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 via-blush-400 to-gold-400 shadow-glow flex items-center justify-center overflow-hidden flex-shrink-0">
                {emblemIsImage ? (
                  <img src={form.emblem} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-display font-black text-xl">{form.emblem || 'DT'}</span>
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <input className="input" value={emblemIsImage ? '' : form.emblem}
                  onChange={set('emblem')}
                  placeholder="Short text like DT"
                  disabled={emblemIsImage} />
                <div className="flex gap-2">
                  <label className="btn-ghost cursor-pointer text-xs flex-1 justify-center">
                    {uploading ? 'Uploading…' : '📁 Upload logo image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleEmblemFile} />
                  </label>
                  {emblemIsImage && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, emblem: 'DT' }))}
                      className="btn-ghost text-xs">Remove</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Main Tagline</label>
            <input className="input" value={form.tagline} onChange={set('tagline')} />
          </div>
          <div>
            <label className="label">Sub-Tagline</label>
            <input className="input" value={form.sub_tagline} onChange={set('sub_tagline')} />
          </div>
          <div>
            <label className="label">WhatsApp Phone</label>
            <input className="input" value={form.phone1} onChange={set('phone1')} placeholder="+91 7529078910" />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={set('address')} />
          </div>
          <div>
            <label className="label">Admin Password</label>
            <input className="input" type="text" value={form.admin_password} onChange={set('admin_password')} placeholder="Password for Edit Mode" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2 text-sm text-red-600">{error}</div>}

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white/95 backdrop-blur -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 border-t border-ivory-200">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">{saving ? 'Saving…' : '💾 Save Branding'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
