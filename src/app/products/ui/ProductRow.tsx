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
    ? "border-emerald-900/40 bg-emerald-950/30 text-emerald-200"
    : "border-zinc-800 bg-zinc-900/30 text-zinc-400"

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
      // rollback
      setP((prev) => ({ ...prev, active: !next }))
      alert("Failed to update active flag.")
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-zinc-100">
              {p.name}
            </div>

            <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[10px] text-zinc-300">
              {p.type}
            </span>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusStyle}`}>
              {p.active ? "ACTIVE" : "INACTIVE"}
            </span>

            <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[10px] text-zinc-400">
              {priceLabel}
            </span>
          </div>

          {p.description ? (
            <div className="mt-2 text-xs text-zinc-500">{p.description}</div>
          ) : (
            <div className="mt-2 text-xs text-zinc-600">No description.</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleActive}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            {p.active ? "Disable" : "Enable"}
          </button>

          <EditProductModal
            product={p}
            onUpdated={(updated) => setP(updated)}
          />
        </div>
      </div>
    </div>
  )
}