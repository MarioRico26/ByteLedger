"use client"

import { useMemo, useState } from "react"
import type { ProductRow, ProductType } from "./ProductsClient"

type Props = {
  product: ProductRow
  onUpdated: (next: ProductRow) => void
}

export default function EditProductModal({ product, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const initial = useMemo(() => {
    return {
      name: product.name,
      type: product.type as ProductType,
      price: product.price ?? "",
      description: product.description ?? "",
      active: product.active,
    }
  }, [product])

  const [name, setName] = useState(initial.name)
  const [type, setType] = useState<ProductType>(initial.type)
  const [price, setPrice] = useState<string>(String(initial.price ?? ""))
  const [description, setDescription] = useState(initial.description)
  const [active, setActive] = useState(initial.active)

  function reset() {
    setName(initial.name)
    setType(initial.type)
    setPrice(String(initial.price ?? ""))
    setDescription(initial.description)
    setActive(initial.active)
    setMsg(null)
  }

  async function save() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          price: price.trim() ? price.trim() : null,
          description: description.trim() ? description.trim() : null,
          active,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to update product")

      onUpdated(data as ProductRow)
      setMsg("✅ Saved")
      setOpen(false)
    } catch (e: any) {
      setMsg(e?.message || "Failed to update")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          reset()
          setOpen(true)
        }}
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
      >
        Edit
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="modal-panel card-stripe max-h-[85vh] w-full max-w-lg overflow-auto p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">Edit item</div>
                <div className="mt-1 text-sm text-slate-500">
                  Update name, type, price, description, and active status.
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-slate-500">Name</span>
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
                  <option value="PRODUCT">Product</option>
                  <option value="SERVICE">Service</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-slate-500">Price (optional)</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 199.99"
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
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>

                <button
                  disabled={loading || !name.trim()}
                  onClick={save}
                  className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
