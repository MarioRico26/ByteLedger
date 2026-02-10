"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export type ProductType = "PRODUCT" | "SERVICE"

export type CreatedProduct = {
  id: string
  name: string
  type: ProductType
  description: string | null
  imageUrl?: string | null
  price: string | null
  active: boolean
  createdAt: string
}

export default function NewProductForm({
  onCreated,
}: {
  onCreated?: (p: CreatedProduct) => void
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [type, setType] = useState<ProductType>("SERVICE")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [active, setActive] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  async function fileToDataUrl(file: File) {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error("Failed to read image"))
      reader.onload = () => resolve(String(reader.result || ""))
      reader.readAsDataURL(file)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const instance = new Image()
      instance.onerror = () => reject(new Error("Invalid image"))
      instance.onload = () => resolve(instance)
      instance.src = rawDataUrl
    })
    const maxSize = 800
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas unavailable")
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL("image/jpeg", 0.88)
  }

  async function submit() {
    setMsg(null)
    if (!name.trim()) {
      setMsg("Name is required.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          price: price.trim() ? price.trim() : null,
          description: description.trim() ? description.trim() : null,
          imageUrl,
          active,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to create product")

      onCreated?.(data as CreatedProduct)

      setName("")
      setType("SERVICE")
      setPrice("")
      setDescription("")
      setImageUrl(null)
      setActive(true)
      setOpen(false)
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="modal-panel card-stripe max-h-[85vh] w-full max-w-lg overflow-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">New catalog item</div>
            <div className="mt-1 text-sm text-slate-500">Create a product or service.</div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            X
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="grid gap-2">
            <span className="text-xs text-slate-500">Photo (optional)</span>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                    setMsg("Image must be PNG, JPG or WEBP.")
                    return
                  }
                  if (file.size > 4 * 1024 * 1024) {
                    setMsg("Image max size is 4MB.")
                    return
                  }
                  try {
                    const dataUrl = await fileToDataUrl(file)
                    setImageUrl(dataUrl)
                    setMsg(null)
                  } catch (err: any) {
                    setMsg(err?.message || "Failed to process image")
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Upload photo
              </button>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                >
                  Remove
                </button>
              ) : null}
            </div>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Product preview"
                className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
              />
            ) : null}
          </div>

          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Name *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="SERVICE">Service</option>
              <option value="PRODUCT">Product</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Price (optional)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 250"
              inputMode="decimal"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-600">Active</span>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
          </label>

          {msg ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {msg}
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading || !name.trim()}
              onClick={submit}
              className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMsg(null)
          setOpen(true)
        }}
        className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-teal-200 hover:bg-teal-400"
      >
        + New item
      </button>

      {open && mounted ? createPortal(modalContent, document.body) : null}
    </>
  )
}
