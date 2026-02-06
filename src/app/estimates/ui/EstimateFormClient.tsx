"use client"

import { useMemo, useState } from "react"

type ProductType = "PRODUCT" | "SERVICE"

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
  initialCustomerId?: string
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

function fmtMoney(n: number) {
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00"
}

function fmtPercent(n: number) {
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })
    : "0"
}

function formatIntegerInput(raw: string) {
  const cleaned = raw.replace(/[^\d]/g, "")
  if (!cleaned) return ""
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return ""
  return n.toLocaleString(undefined)
}

function formatDecimalInput(raw: string, decimals: number) {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "")
  if (!cleaned) return ""

  const hasDot = cleaned.includes(".")
  const [intPartRaw, fracRaw = ""] = cleaned.split(".")
  const intPart = intPartRaw.replace(/^0+(?=\d)/, "")
  const intNumber = intPart ? Number(intPart) : 0
  const intFormatted = intPart ? intNumber.toLocaleString(undefined) : "0"

  if (!hasDot) return intFormatted

  const frac = fracRaw.replace(/[^\d]/g, "").slice(0, decimals)
  return `${intFormatted}.${frac}`
}

function normalizeQtyInput(value: string) {
  const n = Math.max(1, Math.floor(toMoneyNumber(value, 1)))
  return n.toLocaleString(undefined)
}

function normalizeMoneyInput(value: string) {
  const n = Math.max(0, toMoneyNumber(value, 0))
  return fmtMoney(n)
}

function normalizePercentInput(value: string) {
  const n = Math.max(0, toMoneyNumber(value, 0))
  return fmtPercent(n)
}

export default function EstimateFormClient({
  mode,
  estimate,
  customers,
  products,
  initialCustomerId,
}: Props) {
  const isCreate = mode === "create"
  const estimateId = estimate?.id as string | undefined
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState<string>(estimate?.title ?? (isCreate ? "" : "Untitled Estimate"))
  const [customerId, setCustomerId] = useState<string>(
    estimate?.customerId ?? (isCreate ? initialCustomerId ?? "" : "")
  )
  const [notes, setNotes] = useState<string>(estimate?.notes ?? "")

  const [poNumber, setPoNumber] = useState<string>(estimate?.poNumber ?? "")
  const [validUntil, setValidUntil] = useState<string>(toDateOnlyInput(estimate?.validUntil ?? null))

  const [taxRateStr, setTaxRateStr] = useState<string>(
    estimate?.taxRate !== undefined && estimate?.taxRate !== null
      ? fmtPercent(toMoneyNumber(estimate.taxRate, 0))
      : "0"
  )
  const [discountStr, setDiscountStr] = useState<string>(
    estimate?.discountAmount !== undefined && estimate?.discountAmount !== null
      ? fmtMoney(toMoneyNumber(estimate.discountAmount, 0))
      : "0.00"
  )

  const [items, setItems] = useState<FormItem[]>(() => {
    const src = Array.isArray(estimate?.items) ? estimate.items : []
    if (src.length > 0) {
      return src.map((it: any) => {
        const qty = Math.max(1, Math.floor(toMoneyNumber(it.quantity, 1)))
        const unit = Math.max(0, toMoneyNumber(it.unitPrice, 0))
        const unitStr = fmtMoney(unit)
        return {
          _key: uid(),
          productId: it.productId ?? null,
          name: String(it.name ?? ""),
          type: (it.type as ProductType) ?? "PRODUCT",
          quantityStr: qty.toLocaleString(undefined),
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
        type: "PRODUCT",
        quantityStr: "1",
        unitPriceStr: "0.00",
        manualUnitPriceStr: "0.00",
      },
    ]
  })

  const taxRate = toMoneyNumber(taxRateStr, 0)
  const discountAmount = Math.max(toMoneyNumber(discountStr, 0), 0)

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc: any, it: any) => {
      const qty = Math.max(1, Math.floor(toMoneyNumber(it.quantityStr, 1)))
      const unit = Math.max(0, toMoneyNumber(it.unitPriceStr, 0))
      return acc + qty * unit
    }, 0)

    const tax = taxRate > 0 ? subtotal * (taxRate / 100) : 0
    const total = Math.max(subtotal + tax - discountAmount, 0)

    return { subtotal, tax, discount: discountAmount, total }
  }, [items, taxRate, discountAmount])

  function updateItem(key: string, patch: Partial<FormItem>) {
    setItems((prev) => prev.map((it: any) => (it._key === key ? { ...it, ...patch } : it)))
  }

  /**
   * ✅ Cambios pedidos:
   * - Si eligen Custom item: unitPriceStr regresa a "0.00"
   * - Si eligen catálogo: se aplica el precio del producto
   */
  function onPickProduct(key: string, productId: string) {
    if (!productId) {
      setItems((prev) =>
        prev.map((it: any) => {
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
      prev.map((it: any) => {
        if (it._key !== key) return it
        return {
          ...it,
          productId: p.id,
          name: p.name,
          type: p.type,
          unitPriceStr: Number.isFinite(parsed) ? fmtMoney(Math.max(0, parsed)) : it.unitPriceStr,
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
        type: "PRODUCT",
        quantityStr: "1",
        unitPriceStr: "0.00",
        manualUnitPriceStr: "0.00",
      },
    ])
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it: any) => it._key !== key)))
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
      items: items.map((it: any) => ({
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Estimate title…"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
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

          {/* PO + Valid Until */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">PO Number</label>
              <input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Optional…"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </div>
          </div>

          {/* ITEMS */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-500">Items</label>
              <button
                type="button"
                onClick={addItem}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                + Add item
              </button>
            </div>

            {/* Desktop table */}
            <div className="mt-2 hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-3 py-2 min-w-[170px]">Catalog</th>
                      <th className="px-3 py-2 min-w-[240px]">Name</th>
                      <th className="px-3 py-2 w-[110px]">Qty</th>
                      <th className="px-3 py-2 w-[140px]">Price</th>
                      <th className="px-3 py-2 w-[160px]">Subtotal</th>
                      <th className="px-3 py-2 w-[110px]"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((it: any, idx: number) => {
                      const line = lineSubtotal(it)
                      return (
                        <tr key={it._key} className="border-t border-slate-200">
                          <td className="px-3 py-2">
                            <select
                              value={it.productId ?? ""}
                              onChange={(e) => onPickProduct(it._key, e.target.value)}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                            >
                              <option value="">Custom item…</option>
                              {products.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-3 py-2">
                            <input
                              value={it.name}
                              onChange={(e) => updateItem(it._key, { name: e.target.value })}
                              placeholder={idx === 0 ? "e.g. Installation labor" : ""}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              inputMode="numeric"
                              value={it.quantityStr}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => updateItem(it._key, { quantityStr: formatIntegerInput(e.target.value) })}
                              onBlur={(e) => updateItem(it._key, { quantityStr: normalizeQtyInput(e.target.value) })}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              inputMode="decimal"
                              value={it.unitPriceStr}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) =>
                                updateItem(it._key, {
                                  unitPriceStr: formatDecimalInput(e.target.value, 2),
                                  manualUnitPriceStr: e.target.value,
                                })
                              }
                              onBlur={(e) =>
                                updateItem(it._key, {
                                  unitPriceStr: normalizeMoneyInput(e.target.value),
                                  manualUnitPriceStr: normalizeMoneyInput(e.target.value),
                                })
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-700">
                              {line.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                            </div>
                          </td>

                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(it._key)}
                              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
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

            {/* Mobile cards */}
            <div className="mt-3 grid gap-3 md:hidden">
              {items.map((it: any, idx: number) => {
                const line = lineSubtotal(it)
                return (
                  <div key={it._key} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-3">
                      <div>
                        <label className="text-xs text-slate-500">Catalog</label>
                        <select
                          value={it.productId ?? ""}
                          onChange={(e) => onPickProduct(it._key, e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                        >
                          <option value="">Custom item…</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500">Name</label>
                        <input
                          value={it.name}
                          onChange={(e) => updateItem(it._key, { name: e.target.value })}
                          placeholder={idx === 0 ? "e.g. Installation labor" : ""}
                          className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500">Qty</label>
                          <input
                            inputMode="numeric"
                            value={it.quantityStr}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => updateItem(it._key, { quantityStr: formatIntegerInput(e.target.value) })}
                            onBlur={(e) => updateItem(it._key, { quantityStr: normalizeQtyInput(e.target.value) })}
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Price</label>
                          <input
                            inputMode="decimal"
                            value={it.unitPriceStr}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) =>
                              updateItem(it._key, {
                                unitPriceStr: formatDecimalInput(e.target.value, 2),
                                manualUnitPriceStr: e.target.value,
                              })
                            }
                            onBlur={(e) =>
                              updateItem(it._key, {
                                unitPriceStr: normalizeMoneyInput(e.target.value),
                                manualUnitPriceStr: normalizeMoneyInput(e.target.value),
                              })
                            }
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <span>Subtotal</span>
                        <span>{line.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(it._key)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      >
                        Remove item
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            />
          </div>
        </div>
        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-slate-400">Summary</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-slate-500">Tax rate (%)</label>
                <input
                  inputMode="decimal"
                  value={taxRateStr}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setTaxRateStr(formatDecimalInput(e.target.value, 3))}
                  onBlur={(e) => setTaxRateStr(normalizePercentInput(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Discount ($)</label>
                <input
                  inputMode="decimal"
                  value={discountStr}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setDiscountStr(formatDecimalInput(e.target.value, 2))}
                  onBlur={(e) => setDiscountStr(normalizeMoneyInput(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{totals.subtotal.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-600">
                <span>Tax</span>
                <span>{totals.tax.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-600">
                <span>Discount</span>
                <span>-{totals.discount.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm font-semibold text-slate-900">
                <span>Total</span>
                <span>{totals.total.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-teal-500 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
