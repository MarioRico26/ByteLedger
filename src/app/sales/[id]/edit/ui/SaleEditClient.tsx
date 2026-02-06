"use client"

import { useMemo, useState } from "react"
import SearchableSelect, { SearchableOption } from "@/components/SearchableSelect"

function toMoneyNumber(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback
  if (typeof v === "object" && typeof v.toString === "function") v = v.toString()
  if (typeof v === "string") {
    const s = v.trim().replace(/[$,\s]/g, "").replace(/[^\d.-]/g, "")
    if (!s) return fallback
    const n = Number(s)
    return Number.isFinite(n) ? n : fallback
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
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

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function toDateInputValue(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ""
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

type Item = {
  _key: string
  productId: string | null
  name: string
  type: "PRODUCT" | "SERVICE"
  quantityStr: string
  unitPriceStr: string
}

export default function SaleEditClient({
  sale,
  customers,
  products,
}: {
  sale: any
  customers: any[]
  products: any[]
}) {
  const saleId = String(sale?.id ?? "")

  const [customerId, setCustomerId] = useState(sale?.customerId ?? "")
  const [description, setDescription] = useState(sale?.description ?? "")
  const [poNumber, setPoNumber] = useState(sale?.poNumber ?? "")
  const [serviceAddress, setServiceAddress] = useState(sale?.serviceAddress ?? "")
  const [notes, setNotes] = useState(sale?.notes ?? "")
  const [dueDate, setDueDate] = useState(toDateInputValue(sale?.dueDate ?? null))
  const [taxRateStr, setTaxRateStr] = useState(fmtPercent(toMoneyNumber(sale?.taxRate, 0)))
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount")
  const [discountStr, setDiscountStr] = useState(fmtMoney(toMoneyNumber(sale?.discountAmount, 0)))
  const [saving, setSaving] = useState(false)

  const paidAmount = useMemo(() => {
    const paid = Array.isArray(sale?.payments)
      ? sale.payments.reduce((sum: number, p: any) => sum + toMoneyNumber(p.amount, 0), 0)
      : toMoneyNumber(sale?.paidAmount, 0)
    return paid
  }, [sale])

  const [items, setItems] = useState<Item[]>(() => {
    const src = Array.isArray(sale?.items) ? sale.items : []
    return src.length
      ? src.map((it: any) => ({
          _key: uid(),
          productId: it.productId ?? null,
          name: String(it.name ?? ""),
          type: it.type ?? "SERVICE",
          quantityStr: normalizeQtyInput(String(it.quantity ?? "1")),
          unitPriceStr: fmtMoney(Math.max(0, toMoneyNumber(it.unitPrice, 0))),
        }))
      : [{ _key: uid(), productId: null, name: "", type: "SERVICE", quantityStr: "1", unitPriceStr: "0.00" }]
  })

  const productOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: "", label: "Custom item" },
      ...(products ?? []).map((p: any) => ({
        value: p.id,
        label: `${p.name}${p.active === false ? " (inactive)" : ""} (${p.type === "SERVICE" ? "Service" : "Product"})`,
        subLabel: p.price ? `$${Number(p.price).toFixed(2)}` : undefined,
      })),
    ]
  }, [products])

  function updateItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it: any) => (it._key === key ? { ...it, ...patch } : it)))
  }

  function pickProduct(key: string, productId: string) {
    if (!productId) {
      updateItem(key, { productId: null, type: "SERVICE", unitPriceStr: "0.00" })
      return
    }

    const p = products.find((x) => x.id === productId)
    if (!p) return
    updateItem(key, {
      productId: p.id,
      name: p.name,
      type: p.type,
      unitPriceStr: fmtMoney(Math.max(0, toMoneyNumber(p.price, 0))),
    })
  }

  function addLine() {
    setItems((prev) => [
      ...(prev ?? []),
      { _key: uid(), productId: null, name: "", type: "SERVICE", quantityStr: "1", unitPriceStr: "0.00" },
    ])
  }

  function removeLine(key: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it: any) => it._key !== key)))
  }

  function lineSubtotal(it: Item) {
    const qty = Math.max(1, Math.floor(toMoneyNumber(it.quantityStr, 1)))
    const price = Math.max(0, toMoneyNumber(it.unitPriceStr, 0))
    return qty * price
  }

  function handleDiscountTypeChange(next: "amount" | "percent") {
    if (next === discountType) return
    const current = toMoneyNumber(discountStr || 0, 0)
    if (next === "percent") {
      const pct = subtotal > 0 ? Math.min(100, (current / subtotal) * 100) : 0
      setDiscountStr(fmtPercent(pct))
    } else {
      const amount = Math.min(subtotal, (subtotal * current) / 100)
      setDiscountStr(fmtMoney(amount))
    }
    setDiscountType(next)
  }

  const subtotal = useMemo(() => {
    return (items ?? []).reduce((sum: any, it: any) => sum + lineSubtotal(it), 0)
  }, [items])

  const discountInputNum = useMemo(() => Math.max(0, toMoneyNumber(discountStr, 0)), [discountStr])

  const discountAmount = useMemo(() => {
    if (discountType === "percent") {
      const pct = Math.min(discountInputNum, 100)
      return Math.min(subtotal, (subtotal * pct) / 100)
    }
    return Math.min(subtotal, discountInputNum)
  }, [discountInputNum, discountType, subtotal])

  const taxAmount = useMemo(() => {
    const rate = Math.max(0, toMoneyNumber(taxRateStr, 0))
    const taxableBase = Math.max(subtotal - discountAmount, 0)
    return taxableBase * (rate / 100)
  }, [subtotal, taxRateStr, discountAmount])

  const total = useMemo(() => {
    return Math.max(subtotal - discountAmount + taxAmount, 0)
  }, [subtotal, discountAmount, taxAmount])

  const remaining = useMemo(() => Math.max(total - paidAmount, 0), [total, paidAmount])
  const totalTooLow = total < paidAmount

  async function save() {
    if (!saleId) return alert("Missing sale id.")
    if (!customerId) return alert("Select a customer.")
    if (items.some((it) => !String(it.name).trim())) return alert("All items must have a name.")
    if (totalTooLow) return alert("Total cannot be less than already paid amount.")

    const payload = {
      customerId,
      description,
      poNumber: poNumber.trim() ? poNumber.trim() : null,
      serviceAddress: serviceAddress.trim() ? serviceAddress.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
      dueDate: dueDate || null,
      taxRate: Math.max(0, toMoneyNumber(taxRateStr, 0)),
      discountAmount: Math.max(0, discountAmount),
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
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Save failed")
      window.location.assign(`/sales/${saleId}`)
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
          <div className="grid gap-4 md:grid-cols-2">
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

            <div>
              <label className="text-xs text-slate-500">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs text-slate-500">PO Number</label>
              <input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Service address</label>
              <input
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
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
                onClick={addLine}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                + Add item
              </button>
            </div>

            {/* Desktop table */}
            <div className="mt-2 hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-3 py-2 min-w-[190px]">Catalog</th>
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
                            <SearchableSelect
                              value={it.productId ?? ""}
                              onChange={(v) => pickProduct(it._key, v)}
                              options={productOptions}
                              placeholder="Search catalog..."
                              portal
                            />
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
                              onChange={(e) => updateItem(it._key, { unitPriceStr: formatDecimalInput(e.target.value, 2) })}
                              onBlur={(e) => updateItem(it._key, { unitPriceStr: normalizeMoneyInput(e.target.value) })}
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
                              onClick={() => removeLine(it._key)}
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
                        <div className="mt-1">
                          <SearchableSelect
                            value={it.productId ?? ""}
                            onChange={(v) => pickProduct(it._key, v)}
                            options={productOptions}
                            placeholder="Search catalog..."
                            portal
                          />
                        </div>
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
                            onChange={(e) => updateItem(it._key, { unitPriceStr: formatDecimalInput(e.target.value, 2) })}
                            onBlur={(e) => updateItem(it._key, { unitPriceStr: normalizeMoneyInput(e.target.value) })}
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
                        onClick={() => removeLine(it._key)}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-slate-400">Summary</div>
          <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-slate-500">Tax rate (%)</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    inputMode="decimal"
                    value={taxRateStr}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setTaxRateStr(formatDecimalInput(e.target.value, 3))}
                    onBlur={(e) => setTaxRateStr(normalizePercentInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                  <select
                    value={["0", "5", "7.5", "8.25", "10"].includes(taxRateStr) ? taxRateStr : "custom"}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v !== "custom") setTaxRateStr(v)
                    }}
                    className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="7.5">7.5%</option>
                    <option value="8.25">8.25%</option>
                    <option value="10">10%</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500">Discount</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    inputMode="decimal"
                    value={discountStr}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) =>
                      setDiscountStr(formatDecimalInput(e.target.value, discountType === "percent" ? 3 : 2))
                    }
                    onBlur={(e) =>
                      setDiscountStr(
                        discountType === "percent"
                          ? normalizePercentInput(e.target.value)
                          : normalizeMoneyInput(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => handleDiscountTypeChange(e.target.value as "amount" | "percent")}
                    className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
                  >
                    <option value="amount">$</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Row label="Subtotal" value={subtotal.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
              <Row label="Tax" value={taxAmount.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
              <Row label="Discount" value={`-${discountAmount.toLocaleString(undefined, { style: "currency", currency: "USD" })}`} />
              <div className="mt-2 flex justify-between text-sm font-semibold text-slate-900">
                <span>Total</span>
                <span>{total.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Paid to date</span>
                  <span>{paidAmount.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining</span>
                  <span>{remaining.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
                </div>
              </div>
              {totalTooLow ? (
                <div className="mt-2 text-xs text-rose-600">
                  Total cannot be lower than amount already paid.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => window.location.assign(`/sales/${saleId}`)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || totalTooLow}
              className="rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}
