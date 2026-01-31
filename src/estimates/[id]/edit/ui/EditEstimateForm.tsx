"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type ProductType = "PRODUCT" | "SERVICE"

type CustomerRow = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
}

type ProductRow = {
  id: string
  name: string
  price: any
  type: ProductType
}

type Line = {
  productId: string | null
  name: string
  type: ProductType
  quantity: number
  unitPrice: number
}

export default function EditEstimateForm({
  estimate,
  customers,
  products,
}: {
  estimate: {
    id: string
    title: string
    customerId: string
    notes: string | null
    taxRate: number
    discountAmount: number
    items: Line[]
  }
  customers: CustomerRow[]
  products: ProductRow[]
}) {
  const router = useRouter()

  const [title, setTitle] = useState(estimate.title)
  const [customerId, setCustomerId] = useState(estimate.customerId)
  const [notes, setNotes] = useState(estimate.notes || "")
  const [taxRate, setTaxRate] = useState<number>(estimate.taxRate || 0)
  const [discountAmount, setDiscountAmount] = useState<number>(estimate.discountAmount || 0)
  const [lines, setLines] = useState<Line[]>(
    estimate.items.length
      ? estimate.items
      : [{ productId: null, name: "", type: "SERVICE", quantity: 1, unitPrice: 0 }]
  )
  const [saving, setSaving] = useState(false)

  const customer = useMemo(
    () => customers.find((c) => c.id === customerId) || null,
    [customers, customerId]
  )

  function money(n: any) {
    const v = Number(n)
    return Number.isFinite(v) ? v : 0
  }

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => sum + money(l.quantity) * money(l.unitPrice), 0)
  }, [lines])

  const taxAmount = useMemo(
    () => (taxRate > 0 ? subtotal * (taxRate / 100) : 0),
    [subtotal, taxRate]
  )

  const total = useMemo(
    () => Math.max(subtotal + taxAmount - money(discountAmount), 0),
    [subtotal, taxAmount, discountAmount]
  )

  function updateLine(idx: number, next: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...next } : l)))
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: null, name: "", type: "SERVICE", quantity: 1, unitPrice: 0 }])
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  function onPickProduct(idx: number, productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    updateLine(idx, {
      productId: p.id,
      name: p.name,
      type: p.type,
      unitPrice: money(p.price),
    })
  }

  async function save() {
    try {
      setSaving(true)

      const payload = {
        title,
        customerId,
        notes: notes.trim() ? notes : null,
        taxRate: Number.isFinite(taxRate) ? taxRate : 0,
        discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
        items: lines
          .filter((l) => (l.name || "").trim())
          .map((l) => ({
            productId: l.productId,
            name: l.name.trim(),
            type: l.type,
            quantity: Math.max(1, Math.floor(money(l.quantity) || 1)),
            unitPrice: money(l.unitPrice),
          })),
      }

      const res = await fetch(`/api/estimates/${estimate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to update")

      router.push(`/estimates/${estimate.id}`)
      router.refresh()
    } catch (e: any) {
      alert(e?.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm text-zinc-400">Edit estimate</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100">{estimate.id}</div>
          {customer ? (
            <div className="mt-2 text-xs text-zinc-500">
              Customer: <span className="text-zinc-300">{customer.fullName}</span>
              {customer.email ? <span className="text-zinc-500"> • {customer.email}</span> : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/estimates/${estimate.id}`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            Cancel
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-950/50 disabled:opacity-50"
            type="button"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Title</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-600/40"
            placeholder="Estimate title"
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Customer</div>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="text-xs text-zinc-500">Line items</div>

        <div className="mt-3 space-y-3">
          {lines.map((l, idx) => (
            <div key={idx} className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <div className="text-[11px] text-zinc-500">Product (optional)</div>
                  <select
                    value={l.productId || ""}
                    onChange={(e) => onPickProduct(idx, e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
                  >
                    <option value="">Custom item</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <div className="text-[11px] text-zinc-500">Name</div>
                  <input
                    value={l.name}
                    onChange={(e) => updateLine(idx, { name: e.target.value, productId: l.productId })}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
                    placeholder="Item name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-[11px] text-zinc-500">Type</div>
                  <select
                    value={l.type}
                    onChange={(e) => updateLine(idx, { type: e.target.value as ProductType })}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
                  >
                    <option value="SERVICE">Service</option>
                    <option value="PRODUCT">Product</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <div className="text-[11px] text-zinc-500">Qty</div>
                  <input
                    type="number"
                    value={l.quantity}
                    onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
                    min={1}
                  />
                </div>

                <div className="sm:col-span-1">
                  <div className="text-[11px] text-zinc-500">Unit</div>
                  <input
                    type="number"
                    value={l.unitPrice}
                    onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  Line total: <span className="text-zinc-200">${(money(l.quantity) * money(l.unitPrice)).toFixed(2)}</span>
                </div>
                <button
                  onClick={() => removeLine(idx)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-900/40"
                  type="button"
                  disabled={lines.length <= 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={addLine}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
            type="button"
          >
            Add item
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Discount (amount)</div>
          <input
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
            min={0}
            step={0.01}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Tax rate (%)</div>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
            min={0}
            step={0.001}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Preview total</div>
          <div className="mt-2 text-sm text-zinc-400">
            Subtotal <span className="text-zinc-200">${subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Tax <span className="text-zinc-200">${taxAmount.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Total <span className="text-zinc-200">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="text-xs text-zinc-500">Notes</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none"
          placeholder="Optional notes"
        />
      </div>
    </div>
  )
}
