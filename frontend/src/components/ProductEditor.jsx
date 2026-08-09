import React, { useEffect, useRef, useState } from 'react'
import { uploadImage } from '../lib/db'
import { CATEGORIES } from '../lib/categories'
import { toast } from '../lib/toast'

const DRAFT_KEY = 'dt_product_editor_draft_v3'

function blankVariant() {
  return {
    name: '',
    price: '',
    image_url: '',
  }
}

function blankForm() {
  return {
    brand: '',
    name: '',
    category: 'Fragrances',
    description: '',
    packaging: '',
    price: '',
    image_url: '',
    image_urls: [],
    variants: [],
  }
}

export default function ProductEditor({
  open,
  initial,
  onClose,
  onSave,
}) {
  const editing = Boolean(initial && initial.id)

  const [form, setForm] = useState(blankForm())
  const [hasVariants, setHasVariants] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)

  const hydrated = useRef(false)

  /*
   * Hydrate editor whenever it opens.
   */
  useEffect(() => {
    if (!open) {
      hydrated.current = false
      return
    }

    setError('')

    if (initial) {
      const existingImages = Array.isArray(initial.image_urls)
        ? initial.image_urls.filter(Boolean)
        : []

      /*
       * If this is an old product that only has image_url,
       * automatically convert that into the editor gallery.
       */
      const imageUrls =
        existingImages.length > 0
          ? existingImages
          : initial.image_url
            ? [initial.image_url]
            : []

      setForm({
        brand: initial.brand || '',
        name: initial.name || '',
        category: initial.category || 'Fragrances',
        description: initial.description || '',
        packaging: initial.packaging || '',
        price: initial.price ?? '',
        image_url: initial.image_url || '',
        image_urls: imageUrls,
        variants: (initial.variants || []).map(v => ({
          name: v.name || '',
          price: v.price ?? '',
          image_url: v.image_url || '',
        })),
      })

      setHasVariants((initial.variants || []).length > 0)
      setDraftRestored(false)
    } else {
      /*
       * Restore draft for new products.
       */
      try {
        const raw = localStorage.getItem(DRAFT_KEY)

        if (raw) {
          const d = JSON.parse(raw)

          if (d && !d.editingId && d.form) {
            setForm({
              ...blankForm(),
              ...d.form,
              image_urls: Array.isArray(d.form.image_urls)
                ? d.form.image_urls
                : [],
            })

            setHasVariants(!!d.hasVariants)
            setDraftRestored(true)
          } else {
            setForm(blankForm())
            setHasVariants(false)
            setDraftRestored(false)
          }
        } else {
          setForm(blankForm())
          setHasVariants(false)
          setDraftRestored(false)
        }
      } catch {
        setForm(blankForm())
        setHasVariants(false)
        setDraftRestored(false)
      }
    }

    hydrated.current = true
  }, [open, initial])

  /*
   * Save unfinished new-product drafts locally.
   */
  useEffect(() => {
    if (!open || !hydrated.current) return
    if (initial && initial.id) return

    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          editingId: null,
          form,
          hasVariants,
        })
      )
    } catch {
      // Ignore localStorage failures.
    }
  }, [form, hasVariants, open, initial])

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // Ignore.
    }
  }

  if (!open) return null

  const set = (key) => (e) => {
    setForm(current => ({
      ...current,
      [key]: e.target.value,
    }))
  }

  /*
   * Upload ONE image.
   */
  async function uploadSingleFile(file) {
    return uploadImage(file)
  }

  /*
   * Upload MULTIPLE images selected from the file picker.
   */
  async function handleMultipleImages(e) {
    const files = Array.from(e.target.files || [])

    if (!files.length) return

    const tId = toast.loading(
      files.length === 1
        ? 'Uploading photo…'
        : `Uploading ${files.length} photos…`
    )

    try {
      setUploading(true)
      setError('')

      const uploadedUrls = []

      /*
       * Upload sequentially rather than all at once.
       * This is safer for large iPhone photos.
       */
      for (const file of files) {
        const url = await uploadSingleFile(file)
        uploadedUrls.push(url)
      }

      setForm(current => ({
        ...current,
        image_urls: [
          ...(Array.isArray(current.image_urls)
            ? current.image_urls
            : []),
          ...uploadedUrls,
        ],
        /*
         * Keep image_url synced with the first image
         * for backwards compatibility.
         */
        image_url:
          current.image_url ||
          uploadedUrls[0] ||
          '',
      }))

      toast.dismiss(tId)
      toast.success(
        files.length === 1
          ? 'Photo uploaded!'
          : `${files.length} photos uploaded!`
      )
    } catch (err) {
      toast.dismiss(tId)
      toast.error(
        'Upload failed — check bucket policies'
      )
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  /*
   * Upload an individual variant image.
   */
  async function handleVariantFile(e, idx) {
    const file = e.target.files?.[0]

    if (!file) return

    const tId = toast.loading('Uploading variant photo…')

    try {
      setUploading(true)
      setError('')

      const url = await uploadSingleFile(file)

      setForm(current => {
        const variants = [...current.variants]

        variants[idx] = {
          ...variants[idx],
          image_url: url,
        }

        return {
          ...current,
          variants,
        }
      })

      toast.dismiss(tId)
      toast.success('Variant photo uploaded!')
    } catch (err) {
      toast.dismiss(tId)
      toast.error(
        'Upload failed — check bucket policies'
      )
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  /*
   * Add an image URL manually.
   */
  function addImageUrl() {
    setForm(current => ({
      ...current,
      image_urls: [
        ...(current.image_urls || []),
        '',
      ],
    }))
  }

  /*
   * Change manually-entered image URL.
   */
  function updateImageUrl(index, value) {
    setForm(current => {
      const imageUrls = [...(current.image_urls || [])]
      imageUrls[index] = value

      return {
        ...current,
        image_urls: imageUrls,
        image_url:
          imageUrls[0] || '',
      }
    })
  }

  /*
   * Remove an image.
   */
  function removeImage(index) {
    setForm(current => {
      const imageUrls = [
        ...(current.image_urls || []),
      ]

      imageUrls.splice(index, 1)

      return {
        ...current,
        image_urls: imageUrls,
        image_url:
          imageUrls[0] || '',
      }
    })
  }

  function addVariant() {
    setForm(current => ({
      ...current,
      variants: [
        ...current.variants,
        blankVariant(),
      ],
    }))
  }

  function updateVariant(i, key, value) {
    setForm(current => {
      const variants = [...current.variants]

      variants[i] = {
        ...variants[i],
        [key]: value,
      }

      return {
        ...current,
        variants,
      }
    })
  }

  function removeVariant(i) {
    setForm(current => ({
      ...current,
      variants: current.variants.filter(
        (_, index) => index !== i
      ),
    }))
  }

  async function submit(e) {
    e.preventDefault()

    if (
      !form.brand.trim() ||
      !form.name.trim()
    ) {
      setError(
        'Brand and product name are required'
      )
      return
    }

    setSaving(true)
    setError('')

    const tId = toast.loading(
      editing
        ? 'Saving changes…'
        : 'Adding product…'
    )

    try {
      const cleanedImages = (
        Array.isArray(form.image_urls)
          ? form.image_urls
          : []
      )
        .map(url => url.trim())
        .filter(Boolean)

      const payload = {
        brand: form.brand.trim(),
        name: form.name.trim(),
        category: form.category,
        description:
          form.description.trim() || null,
        packaging:
          form.packaging.trim() || null,

        price: hasVariants
          ? null
          : (
              form.price === ''
                ? null
                : Number(form.price)
            ),

        /*
         * Keep the old field populated with
         * the first gallery image.
         */
        image_url:
          cleanedImages[0] ||
          form.image_url ||
          null,

        /*
         * New multiple-image field.
         */
        image_urls: cleanedImages,

        variants: hasVariants
          ? form.variants
              .filter(v => v.name.trim())
              .map(v => ({
                name: v.name.trim(),
                price:
                  v.price === ''
                    ? null
                    : Number(v.price),
                image_url:
                  v.image_url || null,
              }))
          : [],
      }

      await onSave(payload)

      toast.dismiss(tId)
      toast.success(
        editing
          ? 'Product updated & saved to cloud ✨'
          : 'Product added to catalog 🌸'
      )

      clearDraft()
      onClose()
    } catch (err) {
      toast.dismiss(tId)
      toast.error(
        err.message || 'Save failed'
      )
      setError(
        err.message || 'Failed to save'
      )
    } finally {
      setSaving(false)
    }
  }

  function discardDraft() {
    clearDraft()
    setForm(blankForm())
    setHasVariants(false)
    setDraftRestored(false)
    toast.info('Draft discarded')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-cocoa-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto card-surface rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-hero animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/95 backdrop-blur -mx-5 sm:-mx-6 px-5 sm:px-6 py-2 z-10">
          <h2 className="font-display text-xl sm:text-2xl font-black text-shimmer">
            {editing
              ? '✏️ Edit Product'
              : '➕ Add New Product'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-ivory-50 hover:bg-white text-rose-500 flex items-center justify-center border border-ivory-200"
          >
            ✕
          </button>
        </div>

        {/* Restored draft */}
        {draftRestored && !editing && (
          <div className="mb-3 flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-2xl px-3 py-2 text-xs text-cocoa-700">
            <span>💾</span>

            <span className="flex-1">
              We restored an unfinished draft from your last visit.
            </span>

            <button
              type="button"
              onClick={discardDraft}
              className="font-bold text-rose-500 hover:underline"
            >
              Discard
            </button>
          </div>
        )}

        <form
          onSubmit={submit}
          className="space-y-4"
        >
          {/* Brand + category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">
                Brand *
              </label>

              <input
                className="input"
                value={form.brand}
                onChange={set('brand')}
                placeholder="e.g. Killer"
              />
            </div>

            <div>
              <label className="label">
                Category
              </label>

              <select
                className="input"
                value={form.category}
                onChange={set('category')}
              >
                {CATEGORIES
                  .filter(c => c !== 'All')
                  .map(c => (
                    <option
                      key={c}
                      value={c}
                    >
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label">
              Product Name *
            </label>

            <input
              className="input"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Storm / Cyclone / Wave"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Description
            </label>

            <input
              className="input"
              value={form.description}
              onChange={set('description')}
              placeholder="Short product description"
            />
          </div>

          {/* Packaging */}
          <div>
            <label className="label">
              Packaging
            </label>

            <input
              className="input"
              value={form.packaging}
              onChange={set('packaging')}
              placeholder="e.g. Aerosol spray canister"
            />
          </div>

          {/* =====================================================
              PRODUCT IMAGE GALLERY
          ===================================================== */}

          <div className="bg-ivory-50 border border-ivory-200 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <label className="label mb-0">
                  Product Images
                </label>

                <p className="text-[11px] text-cocoa-500 mt-1">
                  Upload multiple photos. They will automatically
                  rotate when customers open the product.
                </p>
              </div>

              <label className="btn-primary cursor-pointer whitespace-nowrap text-xs">
                {uploading
                  ? 'Uploading…'
                  : '📁 Add Photos'}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={handleMultipleImages}
                />
              </label>
            </div>

            {/* Manual URL */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={addImageUrl}
                className="pill-ghost text-xs"
              >
                + Add Image URL
              </button>

              <span className="text-[11px] text-cocoa-500 self-center">
                You can also paste image URLs.
              </span>
            </div>

            {/* Images */}
            {form.image_urls?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {form.image_urls.map(
                  (url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative bg-white border border-ivory-200 rounded-2xl p-2"
                    >
                      {url ? (
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="w-full aspect-square object-contain rounded-xl bg-ivory-50"
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.3'
                          }}
                        />
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-ivory-50 flex items-center justify-center text-cocoa-500 text-xs text-center px-2">
                          Paste image URL below
                        </div>
                      )}

                      {/* Number */}
                      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-cocoa-900/75 text-white text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() =>
                          removeImage(index)
                        }
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white text-red-500 shadow-sm border border-ivory-200"
                        title="Remove image"
                      >
                        ✕
                      </button>

                      {/* URL field */}
                      <input
                        className="input mt-2 text-[10px] px-2 py-2"
                        value={url}
                        onChange={(e) =>
                          updateImageUrl(
                            index,
                            e.target.value
                          )
                        }
                        placeholder="Image URL"
                      />
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="border border-dashed border-ivory-300 rounded-2xl py-8 text-center">
                <div className="text-3xl mb-2">
                  📷
                </div>

                <p className="text-xs text-cocoa-500">
                  No product photos added yet.
                </p>

                <p className="text-[10px] text-cocoa-400 mt-1">
                  You can upload several photos at once.
                </p>
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="flex items-center gap-3 bg-ivory-50 rounded-2xl px-4 py-3 border border-ivory-200">
            <input
              id="hasVariants"
              type="checkbox"
              checked={hasVariants}
              onChange={(e) =>
                setHasVariants(e.target.checked)
              }
              className="w-5 h-5 rounded accent-rose-500"
            />

            <label
              htmlFor="hasVariants"
              className="font-medium text-cocoa-700 cursor-pointer text-sm"
            >
              This product has multiple variants
              (flavors/shades/sizes)
            </label>
          </div>

          {/* Price */}
          {!hasVariants && (
            <div>
              <label className="label">
                Price (₹)
              </label>

              <input
                className="input"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.price}
                onChange={set('price')}
                placeholder="Leave blank for ₹—"
              />
            </div>
          )}

          {/* Variant editor */}
          {hasVariants && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="label mb-0">
                  Variants
                </span>

                <button
                  type="button"
                  onClick={addVariant}
                  className="pill-ghost text-xs"
                >
                  + Add variant
                </button>
              </div>

              {form.variants.length === 0 && (
                <p className="text-xs text-cocoa-500 italic">
                  No variants yet. Click “+ Add variant”.
                </p>
              )}

              {form.variants.map(
                (v, i) => (
                  <div
                    key={i}
                    className="bg-ivory-50 border border-ivory-200 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-500">
                        Variant #{i + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeVariant(i)
                        }
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        className="input"
                        placeholder="Name / Flavor / Shade"
                        value={v.name}
                        onChange={(e) =>
                          updateVariant(
                            i,
                            'name',
                            e.target.value
                          )
                        }
                      />

                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Price (₹)"
                        value={v.price}
                        onChange={(e) =>
                          updateVariant(
                            i,
                            'price',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <input
                        className="input"
                        placeholder="Variant image URL"
                        value={v.image_url}
                        onChange={(e) =>
                          updateVariant(
                            i,
                            'image_url',
                            e.target.value
                          )
                        }
                      />

                      <label className="btn-ghost cursor-pointer whitespace-nowrap">
                        {uploading
                          ? '…'
                          : '📁'}

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) =>
                            handleVariantFile(
                              e,
                              i
                            )
                          }
                        />
                      </label>

                      {v.image_url && (
                        <img
                          src={v.image_url}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-ivory-200"
                        />
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white/95 backdrop-blur -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 border-t border-ivory-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary flex-1"
            >
              {saving
                ? 'Saving…'
                : (
                  editing
                    ? '💾 Save Changes'
                    : '➕ Add Product'
                )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}