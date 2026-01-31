"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Combobox from "@/components/ui/Combobox"

type Customer = {
  id: string
  fullName: string
  email: string | null
}

type Product = {
  id: string
  name: string
  type: "PRODUCT" | "SERVICE"
  price: string | number | null
  active: boolean
}

type EstimateItemDraft = {
  productId: string | null
  name: string
  type: "PRODUCT" | "SERVICE"
  quantity: number
  unitPrice: number
}

function money(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export default function NewEstimateForm() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [customerId, setCustomerId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [poNumber, setPoNumber] = useState("")
  const [serviceAddress, setServiceAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [validUntil, setValidUntil] = useState("")

  // optional pricing adjustments
  const [discountAmount, setDiscountAmount] = useState<string>("")
  const [taxPercent, setTaxPercent] = useState<string>("")

  const [items, setItems] = useState<EstimateItemDraft[]>([
    { productId: null, name: "", type: "SERVICE", quantity: 1, unitPrice: 0 },
  ])

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        setError(null)

        const cRes = await fetch("/api/customers")
        const cData = await cRes.json()
        if (!cRes.ok) throw new Error(cData?.error || "Failed to load customers")
        const cArr = Array.isArray(cData) ? cData : []
        if (!ignore) {
          setCustomers(
            cArr.map((c: any) => ({
              id: String(c.id),
              fullName: String(c.fullName || ""),
              email: c.email ?? null,
            }))
          )
        }

        const pRes = await fetch("/api/products")
        const pData = await pRes.json()
        if (!pRes.ok) throw new Error(pData?.error || "Failed to load products")

        const pArr = Array.isArray(pData) ? pData : []
        const normalized = pArr
          .map((p: any) => ({
            id: String(p.id),
            name: String(p.name || ""),
            type: (p.type === "PRODUCT" ? "PRODUCT" : "SERVICE") as "PRODUCT" | "SERVICE",
            price: p.price ?? null,
            active: p.active !== false,
          }))
          .filter((p: Product) => p.active)

        if (!ignore) setProducts(normalized)
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load")
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [])

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + money(i.quantity) * money(i.unitPrice), 0)
  }, [items])

  const discount = useMemo(() => Math.max(money(discountAmount), 0), [discountAmount])
  const taxPct = useMemo(() => Math.max(money(taxPercent), 0), [taxPercent])

  const taxable = useMemo(() => Math.max(subtotal - discount, 0), [subtotal, discount])
  const tax = useMemo(() => taxable * (taxPct / 100), [taxable, taxPct])
  const total = useMemo(() => taxable + tax, [taxable, tax])

  function addLine() {
    setItems((prev) => [
      ...prev,
      { productId: null, name: "", type: "SERVICE", quantity: 1, unitPrice: 0 },
    ])
  }

  function removeLine(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateLine(idx: number, patch: Partial<EstimateItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function applyProductToLine(idx: number, productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    updateLine(idx, {
      productId: p.id,
      name: p.name,
      type: p.type,
      unitPrice: money(p.price),
    })
  }

  async function submit() {
    setLoading(true)
    setError(null)

    try {
      if (!customerId) throw new Error("Pick a customer")
      if (!title.trim()) throw new Error("Title is required")
      if (items.length === 0) throw new Error("Add at least one line item")

      const cleanItems = items.map((it) => ({
        productId: it.productId || null,
        name: it.name.trim() || "Item",
        type: it.type,
        quantity: Math.max(money(it.quantity), 0),
        unitPrice: Math.max(money(it.unitPrice), 0),
      }))

      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          title,
          description: description.trim() || null,
          poNumber: poNumber.trim() || null,
          serviceAddress: serviceAddress.trim() || null,
          notes: notes.trim() || null,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          // pricing
          discountAmount: discount,
          taxRate: taxPct / 100,
          items: cleanItems,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to create estimate")

      router.push(`/estimates/${data.id}`)
    } catch (e: any) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Estimate</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create an estimate with customer + line items. Taxes/discounts are optional.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create Estimate"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-xs font-medium text-zinc-500">Title</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            placeholder="Estimate title (ex: Kitchen remodel)"
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs font-medium text-zinc-500">Valid until</div>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <div className="text-xs font-medium text-zinc-500">Customer</div>
          <Combobox
            value={customerId}
            onChange={setCustomerId}
            placeholder="Select customer..."
            options={customers.map((c) => ({
              value: c.id,
              label: c.fullName,
              hint: c.email ? c.email : undefined,
            }))}
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <div className="text-xs font-medium text-zinc-500">Description (optional)</div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            placeholder="Short description"
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs font-medium text-zinc-500">PO Number (optional)</div>
          <input
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            placeholder="PO-12345"
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs font-medium text-zinc-500">Service Address (optional)</div>
          <input
            value={serviceAddress}
            onChange={(e) => setServiceAddress(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            placeholder="Street, City, State"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <div className="text-xs font-medium text-zinc-500">Notes (optional)</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            placeholder="Notes to show on the estimate"
          />
        </label>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Line Items</div>
            <div className="text-xs text-zinc-500">
              Pick from catalog or type custom items. Catalog choice auto-fills name/type/price.
            </div>
          </div>

          <button
            onClick={addLine}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            + Add line
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((it, idx) => {
            const lineTotal = money(it.quantity) * money(it.unitPrice)

            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
              >
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <div className="text-[11px] text-zinc-500">Catalog (optional)</div>
                    <Combobox
                      className="mt-1"
                      value={it.productId || ""}
                      onChange={(val) => applyProductToLine(idx, val)}
                      placeholder="Pick a product/service..."
                      options={products.map((p) => ({
                        value: p.id,
                        label: p.name,
                        hint: `${p.type === "SERVICE" ? "Service" : "Product"} • $${money(p.price).toFixed(2)}`,
                      }))}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <div className="text-[11px] text-zinc-500">Name</div>
                    <input
                      value={it.name}
                      onChange={(e) => updateLine(idx, { name: e.target.value, productId: null })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                      placeholder="Custom item name"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-[11px] text-zinc-500">Type</div>
                    <select
                      value={it.type}
                      onChange={(e) => updateLine(idx, { type: e.target.value as any, productId: null })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    >
                      <option value="SERVICE">Service</option>
                      <option value="PRODUCT">Product</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-[11px] text-zinc-500">Qty</div>
                    <input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => updateLine(idx, { quantity: money(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                      min={0}
                      step={1}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-[11px] text-zinc-500">Unit price</div>
                    <input
                      type="number"
                      value={it.unitPrice}
                      onChange={(e) => updateLine(idx, { unitPrice: money(e.target.value), productId: null })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                      min={0}
                      step={0.01}
                    />
                  </div>

                  <div className="md:col-span-4 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-zinc-500">Line total</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-100">
                        ${lineTotal.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeLine(idx)}
                      disabled={items.length === 1}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/40 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <div className="text-xs text-zinc-500">Pricing</div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
              <div className="text-[11px] text-zinc-500">Subtotal</div>
              <div className="mt-1 text-sm font-semibold">${subtotal.toFixed(2)}</div>
            </div>

            <label className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
              <div className="text-[11px] text-zinc-500">Discount (optional)</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-zinc-500">$</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />
              </div>
            </label>

            <label className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
              <div className="text-[11px] text-zinc-500">Tax (optional)</div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  min={0}
                  step={0.001}
                  placeholder="6.625"
                />
                <span className="text-xs text-zinc-500">%</span>
              </div>
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-300">
            <div className="flex items-center justify-between">
              <span>Taxable base</span>
              <span className="font-medium">${taxable.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax amount</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-zinc-800 pt-4">
            <div className="text-xs text-zinc-500">Estimate Total</div>
            <div className="text-2xl font-semibold">${total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Powered by <span className="text-zinc-200">Byte Networks</span>
      </div>
    </div>
  )
}