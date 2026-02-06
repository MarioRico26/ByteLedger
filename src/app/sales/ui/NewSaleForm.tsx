"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import SearchableSelect, { SearchableOption } from "@/components/SearchableSelect"

type CustomerOption = { id: string; fullName: string; email?: string | null }
type ProductOption = {
  id: string
  name: string
  type: "PRODUCT" | "SERVICE"
  price: string | null
}

type Line = {
  productId: string
  name: string
  type: "PRODUCT" | "SERVICE"
  quantityStr: string
  unitPriceStr: string
}

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

export default function NewSaleForm({
  customers,
  products,
  initialCustomerId,
  initialOpen,
  defaultTaxRate,
}: {
  customers: CustomerOption[]
  products: ProductOption[]
  initialCustomerId?: string
  initialOpen?: boolean
  defaultTaxRate?: string | number | null
}) {
  const [open, setOpen] = useState(Boolean(initialOpen))
  const [loading, setLoading] = useState(false)

  const [customerId, setCustomerId] = useState(initialCustomerId ?? "")
  const [description, setDescription] = useState("")
  const [poNumber, setPoNumber] = useState("")
  const [serviceAddress, setServiceAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [dueDate, setDueDate] = useState("")

  // Optional pricing extras
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount")
  const [discount, setDiscount] = useState<string>("0.00") // dollars
  const [taxRate, setTaxRate] = useState<string>(() => {
    const base = toMoneyNumber(defaultTaxRate ?? 0, 0)
    return fmtPercent(base)
  }) // percent

  const [lines, setLines] = useState<Line[]>([
    {
      productId: "",
      name: "",
      type: "SERVICE",
      quantityStr: "1",
      unitPriceStr: "0.00",
    },
  ])

  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    if (initialCustomerId && !customerId) {
      setCustomerId(initialCustomerId)
    }
    if (initialOpen) {
      setOpen(true)
    }
  }, [initialCustomerId, initialOpen, customerId])

  const customerOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: "", label: "Select a customer" },
      ...(customers ?? []).map((c: any) => ({
        value: c.id,
        label: c.fullName,
        subLabel: c.email ?? undefined,
      })),
    ]
  }, [customers])

  const productOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: "", label: "Custom item" },
      ...(products ?? []).map((p: any) => ({
        value: p.id,
        label: `${p.name} (${p.type === "SERVICE" ? "Service" : "Product"})`,
        subLabel: p.price ? `$${Number(p.price).toFixed(2)}` : undefined,
      })),
    ]
  }, [products])

  const subtotal = useMemo(() => {
    return (lines ?? []).reduce((sum: any, l: any) => {
      const qty = Math.max(1, Math.floor(toMoneyNumber(l.quantityStr, 1)))
      const price = Math.max(0, toMoneyNumber(l.unitPriceStr, 0))
      return sum + qty * price
    }, 0)
  }, [lines])

  const discountInputNum = useMemo(() => {
    const d = toMoneyNumber(discount || 0, 0)
    return Number.isFinite(d) ? Math.max(d, 0) : 0
  }, [discount])

  const taxRateNum = useMemo(() => {
    const r = toMoneyNumber(taxRate || 0, 0)
    return Number.isFinite(r) ? Math.max(r, 0) : 0
  }, [taxRate])

  const discountAmount = useMemo(() => {
    if (discountType === "percent") {
      const pct = Math.min(discountInputNum, 100)
      return Math.min(subtotal, (subtotal * pct) / 100)
    }
    return Math.min(subtotal, discountInputNum)
  }, [discountInputNum, discountType, subtotal])

  const taxableBase = useMemo(() => Math.max(subtotal - discountAmount, 0), [subtotal, discountAmount])
  const taxAmount = useMemo(() => taxableBase * (taxRateNum / 100), [taxableBase, taxRateNum])
  const total = useMemo(() => taxableBase + taxAmount, [taxableBase, taxAmount])

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => (prev ?? []).map((l: any, i: number) => (i === idx ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [
      ...(prev ?? []),
      { productId: "", name: "", type: "SERVICE", quantityStr: "1", unitPriceStr: "0.00" },
    ])
  }

  function removeLine(idx: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_: any, i: number) => i !== idx)))
  }

  function pickProduct(idx: number, productId: string) {
    if (!productId) {
      updateLine(idx, { productId: "", type: "SERVICE", unitPriceStr: "0.00" })
      return
    }

    const p = (products ?? []).find((x) => x.id === productId)
    if (!p) return

    updateLine(idx, {
      productId: p.id,
      name: p.name,
      type: p.type,
      unitPriceStr: p.price ? fmtMoney(Number(p.price)) : "0.00",
    })
  }

  function lineSubtotal(l: Line) {
    return (
      Math.max(1, Math.floor(toMoneyNumber(l.quantityStr, 1))) *
      Math.max(0, toMoneyNumber(l.unitPriceStr, 0))
    )
  }

  function handleDiscountTypeChange(next: "amount" | "percent") {
    if (next === discountType) return
    const current = toMoneyNumber(discount || 0, 0)
    if (next === "percent") {
      const pct = subtotal > 0 ? Math.min(100, (current / subtotal) * 100) : 0
      setDiscount(fmtPercent(pct))
    } else {
      const amount = Math.min(subtotal, (subtotal * current) / 100)
      setDiscount(fmtMoney(amount))
    }
    setDiscountType(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!customerId) return alert("Select a customer")
    const prepared = (lines ?? [])
      .filter((l: any) => l.name.trim())
      .map((l: any) => ({
        productId: l.productId || null,
        name: l.name.trim(),
        type: l.type,
        quantity: Math.max(1, Math.floor(toMoneyNumber(l.quantityStr, 1))),
        unitPrice: Math.max(0, toMoneyNumber(l.unitPriceStr, 0)),
      }))

    if (prepared.length === 0) return alert("Add at least one item")

    const customerName =
      (customers ?? []).find((c: any) => c.id === customerId)?.fullName?.trim() || ""
    const descriptionValue =
      description.trim() ||
      (customerName ? `Invoice for ${customerName}` : `Invoice (${prepared.length} items)`)

    setLoading(true)
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          description: descriptionValue,
          poNumber: poNumber.trim() ? poNumber.trim() : null,
          serviceAddress: serviceAddress.trim() ? serviceAddress.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
          dueDate: dueDate || null,
          discountAmount: discountAmount || 0,
          taxRate: taxRateNum || 0,
          items: prepared,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to create sale")

      // reset
      setCustomerId("")
      setDescription("")
      setPoNumber("")
      setServiceAddress("")
      setNotes("")
      setDueDate("")
      setDiscountType("amount")
      setDiscount("0.00")
      setTaxRate("0")
      setLines([{ productId: "", name: "", type: "SERVICE", quantityStr: "1", unitPriceStr: "0.00" }])

      setOpen(false)
      window.location.reload()
    } catch (err: any) {
      alert(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-teal-200 hover:bg-teal-400"
      >
        + New Sale
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto modal-overlay">
          <div className="modal-panel card-stripe w-full max-w-5xl overflow-hidden">
            <div className="max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900">New Sale</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Create a job with catalog items and automatic totals.
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-6">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Customer *">
                      <SearchableSelect
                        value={customerId}
                        onChange={setCustomerId}
                        options={customerOptions}
                        placeholder="Search customer..."
                      />
                    </Field>

                    <Field label="Description">
                      <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional description"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="PO Number">
                      <input
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        placeholder="Optional"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400"
                      />
                    </Field>

                    <Field label="Due date">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                      />
                    </Field>
                  </div>

                  <Field label="Service address">
                    <input
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                      placeholder="Job site address"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400"
                    />
                  </Field>

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
                            {lines.map((l: any, idx: number) => {
                              const line = lineSubtotal(l)
                              return (
                                <tr key={idx} className="border-t border-slate-200">
                                  <td className="px-3 py-2">
                                    <SearchableSelect
                                      value={l.productId}
                                      onChange={(v) => pickProduct(idx, v)}
                                      options={productOptions}
                                      placeholder="Search catalog..."
                                      portal
                                    />
                                  </td>

                                  <td className="px-3 py-2">
                                    <input
                                      value={l.name}
                                      onChange={(e) => updateLine(idx, { name: e.target.value })}
                                      placeholder={idx === 0 ? "e.g. Installation labor" : ""}
                                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                                    />
                                  </td>

                                  <td className="px-3 py-2">
                                    <input
                                      inputMode="numeric"
                                      value={l.quantityStr}
                                      onFocus={(e) => e.currentTarget.select()}
                                      onChange={(e) => updateLine(idx, { quantityStr: formatIntegerInput(e.target.value) })}
                                      onBlur={(e) => updateLine(idx, { quantityStr: normalizeQtyInput(e.target.value) })}
                                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                                    />
                                  </td>

                                  <td className="px-3 py-2">
                                    <input
                                      inputMode="decimal"
                                      value={l.unitPriceStr}
                                      onFocus={(e) => e.currentTarget.select()}
                                      onChange={(e) =>
                                        updateLine(idx, { unitPriceStr: formatDecimalInput(e.target.value, 2) })
                                      }
                                      onBlur={(e) => updateLine(idx, { unitPriceStr: normalizeMoneyInput(e.target.value) })}
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
                                      onClick={() => removeLine(idx)}
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
                      {lines.map((l: any, idx: number) => {
                        const line = lineSubtotal(l)
                        return (
                          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="grid gap-3">
                              <div>
                                <label className="text-xs text-slate-500">Catalog</label>
                                <div className="mt-1">
                                  <SearchableSelect
                                    value={l.productId}
                                    onChange={(v) => pickProduct(idx, v)}
                                    options={productOptions}
                                    placeholder="Search catalog..."
                                    portal
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-slate-500">Name</label>
                                <input
                                  value={l.name}
                                  onChange={(e) => updateLine(idx, { name: e.target.value })}
                                  placeholder={idx === 0 ? "e.g. Installation labor" : ""}
                                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-slate-500">Qty</label>
                                  <input
                                    inputMode="numeric"
                                    value={l.quantityStr}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onChange={(e) => updateLine(idx, { quantityStr: formatIntegerInput(e.target.value) })}
                                    onBlur={(e) => updateLine(idx, { quantityStr: normalizeQtyInput(e.target.value) })}
                                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-400"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-500">Price</label>
                                  <input
                                    inputMode="decimal"
                                    value={l.unitPriceStr}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onChange={(e) => updateLine(idx, { unitPriceStr: formatDecimalInput(e.target.value, 2) })}
                                    onBlur={(e) => updateLine(idx, { unitPriceStr: normalizeMoneyInput(e.target.value) })}
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
                                onClick={() => removeLine(idx)}
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
                  <Field label="Notes">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes for this job"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400"
                    />
                  </Field>
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
                            value={taxRate}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => setTaxRate(formatDecimalInput(e.target.value, 3))}
                            onBlur={(e) => setTaxRate(normalizePercentInput(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                          />
                          <select
                            value={["0", "5", "7.5", "8.25", "10"].includes(taxRate) ? taxRate : "custom"}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v !== "custom") setTaxRate(v)
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
                            value={discount}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) =>
                              setDiscount(formatDecimalInput(e.target.value, discountType === "percent" ? 3 : 2))
                            }
                            onBlur={(e) =>
                              setDiscount(
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
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={loading}
                    type="submit"
                    className="rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
                  >
                    {loading ? "Saving..." : "Create Sale"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="text-xs text-slate-500">{label}</div>
      {children}
    </label>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-700"}>{value}</span>
    </div>
  )
}
