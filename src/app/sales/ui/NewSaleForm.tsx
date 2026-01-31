"use client"

import { useMemo, useState } from "react"
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
  quantity: number
  unitPrice: string
}

export default function NewSaleForm({
  customers,
  products,
}: {
  customers: CustomerOption[]
  products: ProductOption[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [customerId, setCustomerId] = useState("")
  const [description, setDescription] = useState("")
  const [poNumber, setPoNumber] = useState("")
  const [serviceAddress, setServiceAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [dueDate, setDueDate] = useState("")

  // Optional pricing extras
  const [discount, setDiscount] = useState<string>("") // dollars
  const [taxRate, setTaxRate] = useState<string>("") // percent

  const [lines, setLines] = useState<Line[]>([
    {
      productId: "",
      name: "",
      type: "SERVICE",
      quantity: 1,
      unitPrice: "",
    },
  ])

  const customerOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: "", label: "Select a customer" },
      ...(customers ?? []).map((c) => ({
        value: c.id,
        label: c.fullName,
        subLabel: c.email ?? undefined,
      })),
    ]
  }, [customers])

  const productOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: "", label: "Select catalog item" },
      ...(products ?? []).map((p) => ({
        value: p.id,
        label: `${p.name} (${p.type === "SERVICE" ? "Service" : "Product"})`,
        subLabel: p.price ? `$${Number(p.price).toFixed(2)}` : undefined,
      })),
    ]
  }, [products])

  const subtotal = useMemo(() => {
    return (lines ?? []).reduce((sum, l) => {
      const qty = Number(l.quantity || 0)
      const price = Number(l.unitPrice || 0)
      if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum
      return sum + qty * price
    }, 0)
  }, [lines])

  const discountNum = useMemo(() => {
    const d = Number(discount || 0)
    return Number.isFinite(d) ? Math.max(d, 0) : 0
  }, [discount])

  const taxRateNum = useMemo(() => {
    const r = Number(taxRate || 0)
    return Number.isFinite(r) ? Math.max(r, 0) : 0
  }, [taxRate])

  const taxableBase = useMemo(() => Math.max(subtotal - discountNum, 0), [subtotal, discountNum])
  const taxAmount = useMemo(() => taxableBase * (taxRateNum / 100), [taxableBase, taxRateNum])
  const total = useMemo(() => taxableBase + taxAmount, [taxableBase, taxAmount])

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => (prev ?? []).map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [
      ...(prev ?? []),
      { productId: "", name: "", type: "SERVICE", quantity: 1, unitPrice: "" },
    ])
  }

  function removeLine(idx: number) {
    setLines((prev) => (prev ?? []).filter((_, i) => i !== idx))
  }

  function pickProduct(idx: number, productId: string) {
    if (!productId) {
      // clear selection, keep whatever user typed in name/unitPrice if you want.
      updateLine(idx, { productId: "" })
      return
    }

    const p = (products ?? []).find((x) => x.id === productId)
    if (!p) return

    updateLine(idx, {
      productId: p.id,
      name: p.name,
      type: p.type,
      unitPrice: p.price ?? "",
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!customerId) return alert("Select a customer")
    if (!description.trim()) return alert("Description is required")

    const prepared = (lines ?? [])
      .filter((l) => l.name.trim())
      .map((l) => ({
        productId: l.productId || null,
        name: l.name.trim(),
        type: l.type,
        quantity: Number(l.quantity || 1),
        unitPrice: Number(l.unitPrice || 0),
      }))

    if (prepared.length === 0) return alert("Add at least one item")

    setLoading(true)
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          description,
          poNumber: poNumber.trim() ? poNumber.trim() : null,
          serviceAddress: serviceAddress.trim() ? serviceAddress.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
          dueDate: dueDate || null,
          discount: discountNum || 0,
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
      setDiscount("")
      setTaxRate("")
      setLines([{ productId: "", name: "", type: "SERVICE", quantity: 1, unitPrice: "" }])

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
        className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-100"
      >
        + New Sale
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
            {/* ✅ make modal scrollable */}
            <div className="max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">New Sale</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    Create a job with catalog items and automatic totals.
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Customer *">
                    <SearchableSelect
                      value={customerId}
                      onChange={setCustomerId}
                      options={customerOptions}
                      placeholder="Search customer..."
                    />
                  </Field>

                  <Field label="Description *">
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Camera install at office"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="PO Number">
                    <input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    />
                  </Field>

                  <Field label="Due date">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    />
                  </Field>
                </div>

                <Field label="Service address">
                  <input
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="Job site address"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </Field>

                {/* Optional: discounts & taxes */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Discount (optional, $)">
                    <input
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      inputMode="decimal"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    />
                  </Field>

                  <Field label="Tax rate (optional, %)">
                    <input
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="0"
                      inputMode="decimal"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    />
                  </Field>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Items</div>
                    <button
                      type="button"
                      onClick={addLine}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
                    >
                      + Add item
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {(lines ?? []).map((l, idx) => (
                      <div
                        key={idx}
                        className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 md:grid-cols-12"
                      >
                        <div className="md:col-span-5">
                          <div className="text-[11px] text-zinc-400">Catalog item</div>
                          <div className="mt-1">
                            <SearchableSelect
                              value={l.productId}
                              onChange={(v) => pickProduct(idx, v)}
                              options={productOptions}
                              placeholder="Search catalog..."
                            />
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <div className="text-[11px] text-zinc-400">Name</div>
                          <input
                            value={l.name}
                            onChange={(e) => updateLine(idx, { name: e.target.value })}
                            placeholder="Custom name"
                            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-2 text-sm text-zinc-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-[11px] text-zinc-400">Qty</div>
                          <input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-2 text-sm text-zinc-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-[11px] text-zinc-400">Unit price</div>
                          <input
                            value={l.unitPrice}
                            onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
                            placeholder="0.00"
                            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-2 text-sm text-zinc-100"
                          />
                        </div>

                        <div className="md:col-span-12 flex items-center justify-between">
                          <div className="text-xs text-zinc-500">
                            Line total:{" "}
                            <span className="text-zinc-200">
                              ${Number(l.quantity || 0) * Number(l.unitPrice || 0) || 0}
                            </span>
                          </div>

                          {(lines ?? []).length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-300 sm:max-w-sm sm:ml-auto">
                    <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                    <Row label="Discount" value={`-$${discountNum.toFixed(2)}`} />
                    <Row label={`Tax (${taxRateNum.toFixed(2)}%)`} value={`$${taxAmount.toFixed(2)}`} />
                    <div className="h-px bg-zinc-800" />
                    <Row label="Total" value={`$${total.toFixed(2)}`} strong />
                  </div>
                </div>

                <Field label="Notes">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes for this job"
                    className="h-20 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </Field>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={loading}
                    type="submit"
                    className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-100 disabled:opacity-60"
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
      <div className="text-xs text-zinc-400">{label}</div>
      {children}
    </label>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={strong ? "font-semibold text-zinc-100" : "text-zinc-300"}>{value}</span>
    </div>
  )
}