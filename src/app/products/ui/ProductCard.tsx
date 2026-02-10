// byteledger/src/app/products/ui/ProductCard.tsx
"use client"

import { useState } from "react"
import EditProductModal from "./EditProductModal"
import type { Product } from "./ProductsClient"

function money(n: any) {
  const v = Number(n)
  if (!Number.isFinite(v)) return null
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

type ApiProduct = {
  id: string
  name: string
  description: string | null
  imageUrl?: string | null
  type: "PRODUCT" | "SERVICE"
  price: string | number | null
  active: boolean
  createdAt: string | Date
}

export default function ProductCard({
  product,
  onUpdated,
  onDeleted,
}: {
  product: Product
  onUpdated: (p: Product) => void
  onDeleted: () => void
}) {
  const [loading, setLoading] = useState(false)

  const priceLabel = product.price == null ? null : money(product.price)

  function normalizeApi(p: ApiProduct): Product {
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      imageUrl: p.imageUrl ?? null,
      type: p.type,
      price: p.price == null ? null : Number(p.price),
      active: p.active,
      createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
    }
  }

  async function toggleActive() {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      })
      const data = (await res.json().catch(() => null)) as ApiProduct | null
      if (!res.ok) throw new Error((data as any)?.error || "Failed to update")
      if (!data) throw new Error("Invalid response")
      onUpdated(normalizeApi(data))
    } catch (e: any) {
      alert(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  async function remove() {
    if (!confirm("Delete this item?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to delete")
      onDeleted()
    } catch (e: any) {
      alert(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  const badgeType =
    product.type === "SERVICE"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700"

  const badgeStatus = product.active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-500"

  return (
    <div className="card card-stripe p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex items-start gap-3">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-400">
              IMG
            </div>
          )}
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-900">{product.name}</div>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeType}`}>
              {product.type}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeStatus}`}>
              {product.active ? "ACTIVE" : "INACTIVE"}
            </span>
            {priceLabel ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                {priceLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-xs text-slate-500 line-clamp-2">
            {product.description ? product.description : "No description"}
          </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
            <EditProductModal product={product} onUpdated={onUpdated} />

            <button
              disabled={loading}
              onClick={toggleActive}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
            >
              {product.active ? "Deactivate" : "Activate"}
            </button>

            <button
              disabled={loading}
              onClick={remove}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
