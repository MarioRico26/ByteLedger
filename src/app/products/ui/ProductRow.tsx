// byteledger/src/app/products/ui/ProductRow.tsx
"use client"

import { useMemo, useState } from "react"
import EditProductModal from "./EditProductModal"

type ProductRowModel = {
  id: string
  name: string
  type: "PRODUCT" | "SERVICE"
  description: string | null
  price: string | null
  active: boolean
  createdAt: string
}

function money(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export default function ProductRow({ product }: { product: ProductRowModel }) {
  const [p, setP] = useState<ProductRowModel>(product)
  const priceLabel = useMemo(() => {
    if (p.price === null) return "—"
    return `$${money(p.price).toFixed(2)}`
  }, [p.price])

  const statusStyle = p.active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-500"

  const typeStyle =
    p.type === "SERVICE"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700"

  async function toggleActive() {
    const next = !p.active
    setP((prev) => ({ ...prev, active: next }))

    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to update")

      setP((prev) => ({ ...prev, active: Boolean(data.active) }))
    } catch (e) {
      setP((prev) => ({ ...prev, active: !next }))
      alert("Failed to update active flag.")
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-900">{p.name}</div>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${typeStyle}`}>
              {p.type}
            </span>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusStyle}`}>
              {p.active ? "ACTIVE" : "INACTIVE"}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
              {priceLabel}
            </span>
          </div>

          {p.description ? (
            <div className="mt-2 text-xs text-slate-500 line-clamp-2">{p.description}</div>
          ) : (
            <div className="mt-2 text-xs text-slate-400">No description.</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleActive}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            {p.active ? "Deactivate" : "Activate"}
          </button>

          <EditProductModal product={p} onUpdated={(updated) => setP(updated)} />
        </div>
      </div>
    </div>
  )
}
