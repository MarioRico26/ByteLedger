"use client"

import { useMemo, useState } from "react"
import { ProductType } from "@prisma/client"

type Customer = { id: string; fullName: string; email: string | null; phone: string | null }
type Product = { id: string; name: string; type: ProductType; price: number | null }

type FormItem = {
  _key: string
  productId: string | null
  name: string
  type: ProductType

  quantityStr: string
  unitPriceStr: string

  // aún lo mantenemos por si luego quieres “recuerda el manual”
  manualUnitPriceStr: string
}

type Props = {
  mode: "edit" | "create"
  estimate?: any
  customers: Customer[]
  products: Product[]
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function toMoneyNumber(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback

  if (typeof v === "object" && typeof v.toString === "function") {
    v = v.toString()
  }

  if (typeof v === "string") {
    const s = v.trim().replace(/[$,\s]/g, "").replace(/[^\d.-]/g, "")
    if (!s) return fallback
    const n = Number(s)
    return Number.isFinite(n) ? n : fallback
  }

  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function toDateOnlyInput(v?: Date | string | null) {
  if (!v) return ""
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function fmt2(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

export default function EstimateFormClient({ mode, estimate, customers, products }: Props) {
  const isCreate = mode === "create"
  const estimateId = estimate?.id as string | undefined
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState<string>(estimate?.title ?? (isCreate ? "" : "Untitled Estimate"))
  const [customerId, setCustomerId] = useState<string>(estimate?.customerId ?? "")
  const [notes, setNotes] = useState<string>(estimate?.notes ?? "")

  const [poNumber, setPoNumber] = useState<string>(estimate?.poNumber ?? "")
  const [validUntil, setValidUntil] = useState<string>(toDateOnlyInput(estimate?.validUntil ?? null))

  const [taxRateStr, setTaxRateStr] = useState<string>(
    estimate?.taxRate !== undefined && estimate?.taxRate !== null ? String(toMoneyNumber(estimate.taxRate, 0)) : "0"
  )
  const [discountStr, setDiscountStr] = useState<string>(
    estimate?.discountAmount !== undefined && estimate?.discountAmount !== null
      ? String(toMoneyNumber(estimate.discountAmount, 0))
      : "0"
  )

  const [items, setItems] = useState<FormItem[]>(() => {
    const src = Array.isArray(estimate?.items) ? estimate.items : []
    if (src.length > 0) {
      return src.map((it: any) => {
        const qty = Math.max(1, Math.floor(toMoneyNumber(it.quantity, 1)))
        const unit = Math.max(0, toMoneyNumber(it.unitPrice, 0))
        const unitStr = fmt2(unit)
        return {
          _key: uid(),
          productId: it.productId ?? null,
          name: String(it.name ?? ""),
          type: (it.type as ProductType) ?? ProductType.PRODUCT,
          quantityStr: String(qty),
          unitPriceStr: unitStr,
          manualUnitPriceStr: unitStr,
        }
      })
    }

    return [
      {
        _key: uid(),
        productId: null,
        name: "",
        type: ProductType.PRODUCT,
        quantityStr: "1",
        unitPriceStr: "0.00",
        manualUnitPriceStr: "0.00",
      },
    ]
  })

  const taxRate = toMoneyNumber(taxRateStr, 0)
  const discountAmount = Math.max(toMoneyNumber(discountStr, 0), 0)

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => {
      const qty = Math.max(1, Math.floor(toMoneyNumber(it.quantityStr, 1)))
      const unit = Math.max(0, toMoneyNumber(it.unitPriceStr, 0))
      return acc + qty * unit
    }, 0)

    const tax = taxRate > 0 ? subtotal * (taxRate / 100) : 0
    const total = Math.max(subtotal + tax - discountAmount, 0)

    return { subtotal, tax, discount: discountAmount, total }
  }, [items, taxRate, discountAmount])

  function updateItem(key: string, patch: Partial<FormItem>) {
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, ...patch } : it)))
  }

  /**
   * ✅ Cambios pedidos:
   * - Si eligen Custom item: unitPriceStr regresa a "0.00"
   * - Si eligen catálogo: se aplica el precio del producto
   */
  function onPickProduct(key: string, productId: string) {
    if (!productId) {
      setItems((prev) =>
        prev.map((it) => {
          if (it._key !== key) return it
          return {
            ...it,
            productId: null,
            // ✅ lo que pediste: volver a 0 al ser custom
            unitPriceStr: "0.00",
            manualUnitPriceStr: "0.00",
          }
        })
      )
      return
    }

    const p = products.find((x) => x.id === productId)
    if (!p) return

    const parsed = p.price !== null && p.price !== undefined ? Number(p.price) : NaN

    setItems((prev) =>
      prev.map((it) => {
        if (it._key !== key) return it
        return {
          ...it,
          productId: p.id,
          name: p.name,
          type: p.type,
          unitPriceStr: Number.isFinite(parsed) ? fmt2(Math.max(0, parsed)) : it.unitPriceStr,
        }
      })
    )
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        _key: uid(),
        productId: null,
        name: "",
        type: ProductType.PRODUCT,
        quantityStr: "1",
        unitPriceStr: "0.00",
        manualUnitPriceStr: "0.00",
      },
    ])
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it._key !== key)))
  }

  function lineSubtotal(it: FormItem) {
    const qty = Math.max(1, Math.floor(toMoneyNumber(it.quantityStr, 1)))
    const unit = Math.max(0, toMoneyNumber(it.unitPriceStr, 0))
    return qty * unit
  }

  async function save() {
    if (!customerId) {
      alert("Select a customer")
      return
    }
    if (items.some((it) => !it.name.trim())) {
      alert("All items must have a name")
      return
    }

    const payload = {
      title: title.trim() || "Untitled Estimate",
      customerId,
      notes: notes || null,
      poNumber: poNumber.trim() || null,
      validUntil: validUntil.trim() || null,
      taxRate,
      discountAmount,
      items: items.map((it) => ({
        productId: it.productId,
        name: it.name,
        type: it.type,
        quantity: Math.max(1, Math.floor(toMoneyNumber(it.quantityStr, 1))),
        unitPrice: Math.max(0, toMoneyNumber(it.unitPriceStr, 0)),
      })),
    }

    setSaving(true)
    try {
      const url = mode === "edit" && estimateId ? `/api/estimates/${estimateId}` : `/api/estimates`
      const method = mode === "edit" ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Save failed")

      const id = data?.id || estimateId
      if (id) window.location.href = `/estimates/${id}/quote`
    } catch (e: any) {
      alert(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      {/* Header */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Estimate title…"
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PO + Valid Until */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-500">PO Number</label>
          <input
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Optional…"
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Valid Until</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* ITEMS TABLE (matricial) */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-500">Items</label>
          <button
            type="button"
            onClick={addItem}
            className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/40"
          >
            + Add item
          </button>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-zinc-950/60">
                <tr className="text-left text-xs text-zinc-400">
                  <th className="px-3 py-2">Catalog</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 w-[110px]">Qty</th>
                  <th className="px-3 py-2 w-[140px]">Price</th>
                  <th className="px-3 py-2 w-[160px]">Subtotal</th>
                  <th className="px-3 py-2 w-[90px]"></th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, idx) => {
                  const line = lineSubtotal(it)
                  return (
                    <tr key={it._key} className="border-t border-zinc-800">
                      {/* Catalog */}
                      <td className="px-3 py-2">
                        <select
                          value={it.productId ?? ""}
                          onChange={(e) => onPickProduct(it._key, e.target.value)}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        >
                          <option value="">Custom item…</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Name */}
                      <td className="px-3 py-2">
                        <input
                          value={it.name}
                          onChange={(e) => updateItem(it._key, { name: e.target.value })}
                          placeholder={idx === 0 ? "e.g. Installation labor" : ""}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        />
                      </td>

                      {/* Qty */}
                      <td className="px-3 py-2">
                        <input
                          inputMode="numeric"
                          value={it.quantityStr}
                          onChange={(e) => updateItem(it._key, { quantityStr: e.target.value })}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        />
                      </td>

                      {/* Price */}
                      <td className="px-3 py-2">
                        <input
                          inputMode="decimal"
                          value={it.unitPriceStr}
                          onChange={(e) =>
                            updateItem(it._key, {
                              unitPriceStr: e.target.value,
                              manualUnitPriceStr: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        />
                      </td>

                      {/* Line Subtotal */}
                      <td className="px-3 py-2">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-2 text-zinc-200">
                          ${line.toFixed(2)}
                        </div>
                      </td>

                      {/* Remove */}
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(it._key)}
                          className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/40"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tax/Discount abajo */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs text-zinc-500">Tax rate (%)</label>
          <input
            inputMode="decimal"
            value={taxRateStr}
            onChange={(e) => setTaxRateStr(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Discount ($)</label>
          <input
            inputMode="decimal"
            value={discountStr}
            onChange={(e) => setDiscountStr(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex justify-between text-sm text-zinc-300">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-zinc-300">
            <span>Tax</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-zinc-300">
            <span>Discount</span>
            <span>-${totals.discount.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm font-semibold text-zinc-100">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-5">
        <label className="text-xs text-zinc-500">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
      </div>

      {/* Save */}
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