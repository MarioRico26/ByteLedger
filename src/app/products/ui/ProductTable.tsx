"use client"

import { useMemo, useState } from "react"
import EditProductModal from "./EditProductModal"

type Product = {
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

export default function ProductTable({ products }: { products: Product[] }) {
  const [q, setQ] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return products
    return products.filter((p) => {
      const hay = `${p.name} ${p.type} ${p.description ?? ""}`.toLowerCase()
      return hay.includes(s)
    })
  }, [products, q])

  async function toggleActive(p: Product) {
    setBusyId(p.id)
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to update")
      window.location.reload()
    } catch (e) {
      console.error(e)
      alert("Failed to update active flag")
    } finally {
      setBusyId(null)
    }
  }

  if (!products || products.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        No catalog items yet. Create your first product/service.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">
          {filtered.length} item(s)
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products/services..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-400 sm:max-w-md"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-200">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{p.name}</div>
                  {p.description ? (
                    <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      {p.description}
                    </div>
                  ) : null}
                </td>

                <td className="px-4 py-3 text-slate-600">{p.type}</td>

                <td className="px-4 py-3">
                  <span
                    className={
                      p.active
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700"
                        : "rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500"
                    }
                  >
                    {p.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>

                <td className="px-4 py-3 text-right text-slate-700">
                  {p.price ? `$${money(p.price).toFixed(2)}` : "—"}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      disabled={busyId === p.id}
                      onClick={() => toggleActive(p)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                    >
                      {busyId === p.id ? "..." : p.active ? "Deactivate" : "Activate"}
                    </button>

                    <EditProductModal product={p} onUpdated={() => window.location.reload()} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
