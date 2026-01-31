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
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
      >
        Edit
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          {/* scrollable modal */}
          <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-zinc-100">Edit item</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Update name, type, price, description, and active status.
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProductType)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                >
                  <option value="PRODUCT">Product</option>
                  <option value="SERVICE">Service</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Price (optional)</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 199.99"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Description (optional)</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-2">
                <span className="text-sm text-zinc-200">Active</span>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4"
                />
              </label>

              {msg ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3 text-sm text-zinc-300">
                  {msg}
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                >
                  Cancel
                </button>

                <button
                  disabled={loading || !name.trim()}
                  onClick={save}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
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