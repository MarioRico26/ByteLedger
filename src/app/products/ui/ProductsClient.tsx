// byteledger/src/app/products/ui/ProductsClient.tsx
"use client"

import { useMemo, useState } from "react"
import NewProductForm from "./NewProductForm"
import ProductCard from "./ProductCard"

export type Product = {
  id: string
  name: string
  description: string
  type: "PRODUCT" | "SERVICE"
  price: number | null
  active: boolean
  createdAt: string
}

// 👇 este tipo lo alineamos con tu NewProductForm.tsx (donde description puede ser null)
type CreatedProduct = {
  id: string
  name: string
  description: string | null
  type: "PRODUCT" | "SERVICE"
  price: string | number | null
  active: boolean
  createdAt: string | Date
}

export default function ProductsClient({
  initialProducts,
}: {
  initialProducts: Product[]
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts)

  const [q, setQ] = useState("")
  const [type, setType] = useState<"ALL" | Product["type"]>("ALL")
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    return products.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description || "").toLowerCase().includes(query)

      const matchesType = type === "ALL" ? true : p.type === type

      const matchesStatus =
        status === "ALL"
          ? true
          : status === "ACTIVE"
          ? p.active
          : !p.active

      return matchesQuery && matchesType && matchesStatus
    })
  }, [products, q, type, status])

  function upsert(next: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((x) => x.id === next.id)
      if (idx === -1) return [next, ...prev]
      const copy = [...prev]
      copy[idx] = next
      return copy
    })
  }

  function remove(id: string) {
    setProducts((prev) => prev.filter((x) => x.id !== id))
  }

  function normalizeCreated(p: CreatedProduct): Product {
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      type: p.type,
      price: p.price == null ? null : Number(p.price),
      active: p.active,
      createdAt:
        typeof p.createdAt === "string"
          ? p.createdAt
          : new Date(p.createdAt).toISOString(),
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Products and services you can reuse in sales + estimates.
          </p>
        </div>

        <NewProductForm
          onCreated={(created: CreatedProduct) => upsert(normalizeCreated(created))}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="text-[11px] text-zinc-400">Search</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or description..."
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
          </div>

          <div className="md:col-span-3">
            <div className="text-[11px] text-zinc-400">Type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              <option value="ALL">All</option>
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <div className="text-[11px] text-zinc-400">Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Showing{" "}
          <span className="text-zinc-200 font-semibold">{filtered.length}</span>{" "}
          of{" "}
          <span className="text-zinc-200 font-semibold">{products.length}</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-500">
            No catalog items match your filters.
          </div>
        ) : (
          filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onUpdated={upsert}
              onDeleted={() => remove(p.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}