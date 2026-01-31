// byteledger/src/app/estimates/[id]/edit/ui/EditEstimateForm.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import type { ProductType, EstimateStatus } from "@prisma/client"

type Item = {
  id?: string
  productId: string | null
  name: string
  type: ProductType
  quantity: number
  unitPrice: number
}

type Initial = {
  id: string
  title: string
  status: EstimateStatus
  notes: string
  customerId: string
  taxRate: number
  discountAmount: number
  items: Item[]
}

type ProductRow = {
  id: string
  name: string
  type: ProductType
  price: string
  active: boolean
}

export default function EditEstimateForm({
  estimateId,
  initial,
}: {
  estimateId: string
  initial: Initial
}) {
  const [title, setTitle] = useState(initial.title)
  const [notes, setNotes] = useState(initial.notes || "")
  const [taxRate, setTaxRate] = useState<number>(initial.taxRate || 0)
  const [discountAmount, setDiscountAmount] = useState<number>(initial.discountAmount || 0)
  const [items, setItems] = useState<Item[]>(initial.items?.length ? initial.items : [])
  const [saving, setSaving] = useState(false)

  const [products, setProducts] = useState<ProductRow[]>([])

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/products")
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data?.products)) setProducts(data.products)
    })()
  }, [])

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  }, [items])

  const taxAmount = useMemo(() => {
    const r = Number(taxRate) || 0
    return r > 0 ? subtotal * (r / 100) : 0
  }, [subtotal, taxRate])

  const total = useMemo(() => {
    const d = Number(discountAmount) || 0
    return Math.max(subtotal + taxAmount - d, 0)
  }, [subtotal, taxAmount, discountAmount])

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function addCustomLine() {
    setItems((prev) => [
      ...prev,
      { productId: null, name: "Custom item", type: "SERVICE", quantity: 1, unitPrice: 0 },
    ])
  }

  function removeLine(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true)
    try {
      const payload = {
        title,
        notes,
        taxRate: Number(taxRate) || 0,
        discountAmount: Number(discountAmount) || 0,
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          type: it.type,
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })),
      }

      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to update estimate")

      window.location.href = `/estimates/${estimateId}`
    } catch (e: any) {
      alert(e?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-100">Line Items</div>
          <button
            onClick={addCustomLine}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 hover:bg-zinc-900/40"
          >
            + Add custom item
          </button>
        </div>

        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 md:grid-cols-12">
              <div className="md:col-span-5">
                <label className="text-[11px] text-zinc-500">Item</label>
                <select
                  value={it.productId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || null
                    if (!id) {
                      updateItem(idx, { productId: null })
                      return
                    }
                    const p = products.find((x) => x.id === id)
                    if (p) {
                      updateItem(idx, {
                        productId: p.id,
                        name: p.name,
                        type: p.type,
                        unitPrice: Number(p.price) || 0,
                      })
                    } else {
                      updateItem(idx, { productId: id })
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                >
                  <option value="">Custom</option>
                  {products
                    .filter((p) => p.active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type})
                      </option>
                    ))}
                </select>

                <input
                  value={it.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  placeholder="Custom name"
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] text-zinc-500">Qty</label>
                <input
                  type="number"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[11px] text-zinc-500">Unit price</label>
                <input
                  type="number"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="md:col-span-2 flex items-end justify-between gap-2">
                <div className="text-sm text-zinc-200">
                  ${(Number(it.quantity) * Number(it.unitPrice) || 0).toFixed(2)}
                </div>
                <button
                  onClick={() => removeLine(idx)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 hover:bg-zinc-900/40"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <div className="text-sm text-zinc-500">No items yet.</div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs text-zinc-500">Tax rate (%)</label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Discount amount</label>
          <input
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="flex justify-between text-sm text-zinc-300">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-zinc-300">
            <span>Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-zinc-300">
            <span>Discount</span>
            <span>-${(Number(discountAmount) || 0).toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm font-semibold text-zinc-100">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-950/50 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  )
}