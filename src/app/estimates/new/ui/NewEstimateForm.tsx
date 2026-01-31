//byteledger/src/app/estimates/new/ui/NewEstimateForm.tsx:
"use client"


import type { ChangeEvent, FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Customer = {
  id: string
  fullName: string
  email: string | null
}

type Product = {
  id: string
  name: string
  type: "PRODUCT" | "SERVICE"
  price: string | null
  active: boolean
}

type Item = {
  productId?: string
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

  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerId, setCustomerId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [poNumber, setPoNumber] = useState("")
  const [serviceAddress, setServiceAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [validUntil, setValidUntil] = useState("")

  const [items, setItems] = useState<Item[]>([
    { name: "", type: "SERVICE", quantity: 1, unitPrice: 0 },
  ])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        // customers
        const cRes = await fetch("/api/customers")
        const cData = await cRes.json()
        if (!cRes.ok) throw new Error(cData?.error || "Failed to load customers")
        setCustomers(cData || [])

        // products (optional if you already have it)
        const pRes = await fetch("/api/products")
        const pData = await pRes.json()
        if (!pRes.ok) {
          // si no existe endpoint aún, no explotes, solo deja vacío
          setProducts([])
        } else {
          setProducts((pData || []).filter((p: Product) => p.active))
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load form data")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const total = useMemo(() => {
    return items.reduce((sum, i) => sum + money(i.quantity) * money(i.unitPrice), 0)
  }, [items])

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    )
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", type: "SERVICE", quantity: 1, unitPrice: 0 }])
  }

  function applyProduct(idx: number, productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return

    updateItem(idx, {
      productId: p.id,
      name: p.name,
      type: p.type,
      unitPrice: money(p.price),
      quantity: 1,
    })
  }

  async function submit() {
    setSaving(true)
    setError(null)

    try {
      if (!customerId) throw new Error("Please select a customer")
      if (!title.trim()) throw new Error("Title is required")
      if (items.length === 0) throw new Error("Add at least one item")

      // validate items
      for (const it of items) {
        if (!it.name.trim()) throw new Error("Every item needs a name")
        if (!Number.isFinite(it.quantity) || it.quantity <= 0)
          throw new Error("Item quantity must be > 0")
        if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0)
          throw new Error("Item unit price must be valid")
      }

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
          items: items.map((i) => ({
            productId: i.productId || undefined,
            name: i.name,
            type: i.type,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create estimate")
      }

      // go to detail page
      router.push(`/estimates/${data.id}`)
    } catch (e: any) {
      setError(e?.message || "Failed to create estimate")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-400">
        Loading...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* LEFT */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
          <div className="text-sm font-semibold">Estimate Details</div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <div className="text-xs font-medium text-zinc-500">Customer</div>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                    {c.email ? ` (${c.email})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 sm:col-span-2">
              <div className="text-xs font-medium text-zinc-500">Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Camera Installation - Front & Backyard"
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <div className="text-xs font-medium text-zinc-500">
                Description (optional)
              </div>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short job description..."
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="space-y-1">
              <div className="text-xs font-medium text-zinc-500">PO Number</div>
              <input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO-12345"
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="space-y-1">
              <div className="text-xs font-medium text-zinc-500">
                Valid Until
              </div>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <div className="text-xs font-medium text-zinc-500">
                Service Address (optional)
              </div>
              <input
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                placeholder="123 Main St, Manahawkin NJ 08050"
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <div className="text-xs font-medium text-zinc-500">Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything important..."
                rows={3}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
          </div>
        </div>

        {/* ITEMS */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Items</div>
            <button
              onClick={addItem}
              className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-900/40"
            >
              + Add item
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-3">
                    {products.length > 0 ? (
                      <label className="space-y-1">
                        <div className="text-[11px] text-zinc-500">
                          Pick from Catalog (optional)
                        </div>
                        <select
                          value={it.productId || ""}
                          onChange={(e) =>
                            e.target.value
                              ? applyProduct(idx, e.target.value)
                              : updateItem(idx, { productId: undefined })
                          }
                          className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                        >
                          <option value="">Select product/service...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.type}){" "}
                              {p.price ? `- $${Number(p.price).toFixed(2)}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="space-y-1 sm:col-span-2">
                        <div className="text-[11px] text-zinc-500">Name</div>
                        <input
                          value={it.name}
                          onChange={(e) =>
                            updateItem(idx, { name: e.target.value })
                          }
                          placeholder="Item name..."
                          className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                        />
                      </label>

                      <label className="space-y-1">
                        <div className="text-[11px] text-zinc-500">Type</div>
                        <select
                          value={it.type}
                          onChange={(e) =>
                            updateItem(idx, {
                              type: e.target.value === "PRODUCT" ? "PRODUCT" : "SERVICE",
                            })
                          }
                          className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                        >
                          <option value="SERVICE">SERVICE</option>
                          <option value="PRODUCT">PRODUCT</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <div className="text-[11px] text-zinc-500">Qty</div>
                        <input
                          type="number"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(idx, { quantity: Number(e.target.value) })
                          }
                          className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                        />
                      </label>

                      <label className="space-y-1">
                        <div className="text-[11px] text-zinc-500">Unit Price</div>
                        <input
                          type="number"
                          value={it.unitPrice}
                          onChange={(e) =>
                            updateItem(idx, { unitPrice: Number(e.target.value) })
                          }
                          className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                        />
                      </label>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-2 text-sm text-zinc-200 sm:col-span-2">
                        Line Total:{" "}
                        <span className="font-semibold">
                          ${(money(it.quantity) * money(it.unitPrice)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-900/40 disabled:opacity-40"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            disabled={saving}
            onClick={submit}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create Estimate"}
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
          <div className="text-xs uppercase tracking-widest text-zinc-500">
            Summary
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <div className="text-xs text-zinc-500">Estimate Total</div>
            <div className="mt-1 text-2xl font-semibold">
              ${total.toFixed(2)}
            </div>
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            Powered by <span className="font-semibold text-zinc-300">Byte Networks</span>
          </div>
        </div>
      </div>
    </div>
  )
}