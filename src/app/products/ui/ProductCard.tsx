// byteledger/src/app/products/ui/ProductCard.tsx
"use client"

import { useState } from "react"
import EditProductModal from "./EditProductModal"
import type { Product } from "./ProductsClient"

function money(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

type ApiProduct = {
  id: string
  name: string
  description: string | null
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

  const price = product.price == null ? null : money(product.price)

  function normalizeApi(p: ApiProduct): Product {
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? "",
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
      ? "border-blue-900/40 bg-blue-950/30 text-blue-200"
      : "border-emerald-900/40 bg-emerald-950/30 text-emerald-200"

  const badgeStatus = product.active
    ? "border-zinc-800 bg-zinc-900/30 text-zinc-200"
    : "border-zinc-800 bg-zinc-900/10 text-zinc-400"

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-zinc-100">
              {product.name}
            </div>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeType}`}>
              {product.type}
            </span>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeStatus}`}>
              {product.active ? "ACTIVE" : "INACTIVE"}
            </span>

            {price != null ? (
              <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[10px] text-zinc-300">
                ${price.toFixed(2)}
              </span>
            ) : null}
          </div>

          {product.description ? (
            <div className="mt-2 text-sm text-zinc-400">
              {product.description}
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-600">No description</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 👇 OJO: acá usamos el nombre de prop que tu modal realmente tenga.
              Si tu EditProductModal espera "onUpdated", esto compila.
              Si espera "onSaved" o "onSave", cambialo aquí y ya. */}
          <EditProductModal product={product} onUpdated={onUpdated} />

          <button
            disabled={loading}
            onClick={toggleActive}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40 disabled:opacity-50"
          >
            {product.active ? "Deactivate" : "Activate"}
          </button>

          <button
            disabled={loading}
            onClick={remove}
            className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-950/30 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}