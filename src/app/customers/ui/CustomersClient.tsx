"use client"

import { useMemo, useState } from "react"
import CustomerCard from "./CustomerCard"

export type CustomerDTO = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  homeAddress: string | null
  workAddress: string | null
  reference: string | null
  notes: string | null
  createdAt: string
}

export default function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: CustomerDTO[]
}) {
  const [customers, setCustomers] = useState<CustomerDTO[]>(initialCustomers)
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return customers

    return customers.filter((c) => {
      const blob = [
        c.fullName,
        c.email ?? "",
        c.phone ?? "",
        c.homeAddress ?? "",
        c.workAddress ?? "",
        c.reference ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return blob.includes(s)
    })
  }, [customers, q])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl w-full">
          <label className="block space-y-1">
            <div className="text-xs font-medium text-zinc-500">Search</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email, phone, address..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
          </label>
        </div>

        <div className="text-xs text-zinc-500">
          Showing <span className="text-zinc-200 font-semibold">{filtered.length}</span>{" "}
          of <span className="text-zinc-200 font-semibold">{customers.length}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-500">
          No customers match your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onUpdated={(next) => {
                setCustomers((prev) => prev.map((x) => (x.id === next.id ? next : x)))
              }}
              onDeleted={(id) => {
                setCustomers((prev) => prev.filter((x) => x.id !== id))
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}