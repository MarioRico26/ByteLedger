// byteledger/src/app/products/ui/ProductsClient.tsx
"use client"

import { useMemo, useState } from "react"
import NewProductForm from "./NewProductForm"
import ProductCard from "./ProductCard"

export type ProductType = "PRODUCT" | "SERVICE"

export type Product = {
  id: string
  name: string
  description: string
  type: ProductType
  price: number | null
  active: boolean
  createdAt: string
}

export type ProductRow = Product

// 👇 este tipo lo alineamos con tu NewProductForm.tsx (donde description puede ser null)
type CreatedProduct = {
  id: string
  name: string
  description: string | null
  type: ProductType
  price: string | number | null
  active: boolean
  createdAt: string | Date
}

type GroupKey = "none" | "type" | "status" | "az"

export default function ProductsClient({
  initialProducts,
}: {
  initialProducts: Product[]
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts)

  const [q, setQ] = useState("")
  const [type, setType] = useState<"ALL" | Product["type"]>("ALL")
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [groupBy, setGroupBy] = useState<GroupKey>("none")

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    return products.filter((p: any) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description || "").toLowerCase().includes(query)

      const matchesType = type === "ALL" ? true : p.type === type

      const matchesStatus =
        status === "ALL" ? true : status === "ACTIVE" ? p.active : !p.active

      return matchesQuery && matchesType && matchesStatus
    })
  }, [products, q, type, status])

  const metrics = useMemo(() => {
    const total = products.length
    const active = products.filter((p: any) => p.active).length
    const inactive = total - active
    const productsCount = products.filter((p: any) => p.type === "PRODUCT").length
    const servicesCount = products.filter((p: any) => p.type === "SERVICE").length
    return { total, active, inactive, productsCount, servicesCount }
  }, [products])

  const grouped = useMemo(() => {
    if (groupBy === "none") return null
    const map = new Map<string, Product[]>()
    for (const row of filtered) {
      let key = ""
      if (groupBy === "type") {
        key = row.type === "PRODUCT" ? "Products" : "Services"
      } else if (groupBy === "status") {
        key = row.active ? "Active" : "Inactive"
      } else {
        key = (row.name?.trim()?.[0] || "#").toUpperCase()
      }
      const list = map.get(key) || []
      list.push(row)
      map.set(key, list)
    }

    if (groupBy === "az") {
      const letters = Array.from(map.keys()).sort((a, b) => a.localeCompare(b))
      return letters.map((k: any) => ({ key: k, label: k, rows: map.get(k)! }))
    }

    const order = groupBy === "status" ? ["Active", "Inactive"] : ["Products", "Services"]
    return order
      .filter((k: any) => map.has(k))
      .map((k: any) => ({ key: k, label: k, rows: map.get(k)! }))
  }, [filtered, groupBy])

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
    setProducts((prev) => prev.filter((x: any) => x.id !== id))
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
          <h1 className="page-title">Catalog</h1>
          <p className="page-subtitle">
            Products and services you can reuse in sales + estimates.
          </p>
        </div>

        <NewProductForm
          onCreated={(created: CreatedProduct) => upsert(normalizeCreated(created))}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="card card-stripe p-4">
          <div className="text-xs text-slate-500">Total items</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.total.toLocaleString()}
          </div>
        </div>
        <div className="card card-stripe p-4">
          <div className="text-xs text-slate-500">Active</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.active.toLocaleString()}
          </div>
        </div>
        <div className="card card-stripe p-4">
          <div className="text-xs text-slate-500">Products</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.productsCount.toLocaleString()}
          </div>
        </div>
        <div className="card card-stripe p-4">
          <div className="text-xs text-slate-500">Services</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.servicesCount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="text-[11px] text-slate-500">Search</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or description..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-400"
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-[11px] text-slate-500">Type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="ALL">All</option>
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="text-[11px] text-slate-500">Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="text-[11px] text-slate-500">Group by</div>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupKey)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="none">None</option>
              <option value="type">Type</option>
              <option value="status">Status</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{products.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {(grouped ? grouped : [{ key: "All", label: "All", rows: filtered }]).map((group: any) => (
          <div key={group.key} className="space-y-3">
            {groupBy !== "none" ? (
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {group.label} • {group.rows.length}
              </div>
            ) : null}

            {group.rows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                No catalog items match your filters.
              </div>
            ) : (
              group.rows.map((p: any) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onUpdated={upsert}
                  onDeleted={() => remove(p.id)}
                />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
