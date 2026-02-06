"use client"

import { useState } from "react"

type ProductType = "PRODUCT" | "SERVICE"

function asNumber(v: any, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

export default function EstimateEditClient({
  estimate,
  customers,
  products,
}: {
  estimate: any
  customers: any[]
  products: any[]
}) {
  const estimateId = String(estimate?.id ?? "")
  const [title, setTitle] = useState(estimate?.title ?? "Untitled Estimate")
  const [customerId, setCustomerId] = useState(estimate?.customerId ?? "")
  const [notes, setNotes] = useState(estimate?.notes ?? "")
  const [taxRate, setTaxRate] = useState(asNumber(estimate?.taxRate, 0))
  const [discountAmount, setDiscountAmount] = useState(asNumber(estimate?.discountAmount, 0))
  const [saving, setSaving] = useState(false)

  const [items, setItems] = useState(() => {
    const src = Array.isArray(estimate?.items) ? estimate.items : []
    return src.length
      ? src.map((it: any) => ({
          _key: uid(),
          productId: it.productId ?? null,
          name: String(it.name ?? ""),
          type: (it.type as ProductType) ?? "PRODUCT",
          quantity: asNumber(it.quantity, 1),
          unitPrice: asNumber(it.unitPrice, 0),
        }))
      : [{ _key: uid(), productId: null, name: "", type: "PRODUCT", quantity: 1, unitPrice: 0 }]
  })

  function updateItem(key: string, patch: any) {
    setItems((prev: any[]) => prev.map((it: any) => (it._key === key ? { ...it, ...patch } : it)))
  }

  function pickProduct(key: string, productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    updateItem(key, { productId: p.id, name: p.name, type: p.type, unitPrice: p.price ?? 0 })
  }

  async function save() {
    if (!estimateId) return alert("Missing estimate id.")
    if (!customerId) return alert("Select a customer.")
    if (items.some((it: any) => !String(it.name).trim())) return alert("All items must have a name.")

    const payload = {
      title,
      customerId,
      notes: notes || null,
      taxRate,
      discountAmount,
      items: items.map((it: any) => ({
        productId: it.productId,
        name: it.name,
        type: it.type, // ProductType
        quantity: Math.max(1, Math.floor(asNumber(it.quantity, 1))),
        unitPrice: Math.max(0, asNumber(it.unitPrice, 0)),
      })),
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Save failed")
      window.location.assign(`/estimates/${estimateId}/quote`)
    } catch (e: any) {
      alert(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">Select customer…</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((it: any) => (
          <div key={it._key} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
            <div className="grid gap-3 md:grid-cols-6">
              <div className="md:col-span-2">
                <div className="text-[11px] text-zinc-500">Product (optional)</div>
                <select
                  value={it.productId ?? ""}
                  onChange={(e) => pickProduct(it._key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-sm text-zinc-100"
                >
                  <option value="">Custom item…</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="text-[11px] text-zinc-500">Name</div>
                <input
                  value={it.name}
                  onChange={(e) => updateItem(it._key, { name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-sm text-zinc-100"
                />
              </div>

              <div>
                <div className="text-[11px] text-zinc-500">Qty</div>
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => updateItem(it._key, { quantity: asNumber(e.target.value, 1) })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-sm text-zinc-100"
                />
              </div>

              <div>
                <div className="text-[11px] text-zinc-500">Unit</div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(it._key, { unitPrice: asNumber(e.target.value, 0) })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-sm text-zinc-100"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs text-zinc-500">Tax rate (%)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(asNumber(e.target.value, 0))}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Discount ($)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(asNumber(e.target.value, 0))}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-5 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-950/50 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}
