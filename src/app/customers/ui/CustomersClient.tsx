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
  recentEstimates: {
    id: string
    createdAt: string
    totalAmount: string
    status: string
  }[]
  recentSales: {
    id: string
    createdAt: string
    totalAmount: string
    status: string
  }[]
}

type GroupKey = "none" | "az" | "email" | "phone"

export default function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: CustomerDTO[]
}) {
  const [customers, setCustomers] = useState<CustomerDTO[]>(initialCustomers)
  const [q, setQ] = useState("")
  const [onlyWithEmail, setOnlyWithEmail] = useState(false)
  const [onlyWithPhone, setOnlyWithPhone] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupKey>("none")

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return customers.filter((c: any) => {
      if (onlyWithEmail && !c.email) return false
      if (onlyWithPhone && !c.phone) return false

      if (!s) return true

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
  }, [customers, q, onlyWithEmail, onlyWithPhone])

  const grouped = useMemo(() => {
    if (groupBy === "none") return null
    const map = new Map<string, CustomerDTO[]>()
    for (const row of filtered) {
      let key = ""
      if (groupBy === "az") {
        key = (row.fullName?.trim()?.[0] || "#").toUpperCase()
      } else if (groupBy === "email") {
        key = row.email ? "Has email" : "No email"
      } else {
        key = row.phone ? "Has phone" : "No phone"
      }
      const list = map.get(key) || []
      list.push(row)
      map.set(key, list)
    }

    if (groupBy === "az") {
      const letters = Array.from(map.keys()).sort((a, b) => a.localeCompare(b))
      return letters.map((k: any) => ({ key: k, label: k, rows: map.get(k)! }))
    }

    const ordered = groupBy === "email" ? ["Has email", "No email"] : ["Has phone", "No phone"]
    return ordered
      .filter((k: any) => map.has(k))
      .map((k: any) => ({ key: k, label: k, rows: map.get(k)! }))
  }, [filtered, groupBy])

  const metrics = useMemo(() => {
    const total = customers.length
    const withEmail = customers.filter((c: any) => c.email).length
    const withPhone = customers.filter((c: any) => c.phone).length
    const now = new Date()
    const newThisMonth = customers.filter((c: any) => {
      const d = new Date(c.createdAt)
      if (Number.isNaN(d.valueOf())) return false
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
    return { total, withEmail, withPhone, newThisMonth }
  }, [customers])

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Total customers</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.total.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">With email</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.withEmail.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">With phone</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.withPhone.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">New this month</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.newThisMonth.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block space-y-1">
              <div className="text-xs font-medium text-slate-500">Search</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, email, phone, address..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-400"
              />
            </label>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={onlyWithEmail}
                  onChange={(e) => setOnlyWithEmail(e.target.checked)}
                />
                Has email
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={onlyWithPhone}
                  onChange={(e) => setOnlyWithPhone(e.target.checked)}
                />
                Has phone
              </label>
            </div>

            <div>
              <label className="text-xs text-slate-500">Group by</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupKey)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              >
                <option value="none">None</option>
                <option value="az">A–Z</option>
                <option value="email">Has email</option>
                <option value="phone">Has phone</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
              of <span className="font-semibold text-slate-700">{customers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          No customers match your search.
        </div>
      ) : (
        <div className="space-y-4">
          {(grouped ? grouped : [{ key: "All", label: "All", rows: filtered }]).map((group: any) => (
            <div key={group.key} className="space-y-3">
              {groupBy !== "none" ? (
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {group.label} • {group.rows.length}
                </div>
              ) : null}
              {group.rows.map((c: any) => (
                <CustomerCard
                  key={c.id}
                  customer={c}
                  onUpdated={(next) => {
                    setCustomers((prev) => prev.map((x: any) => (x.id === next.id ? next : x)))
                  }}
                  onDeleted={(id) => {
                    setCustomers((prev) => prev.filter((x: any) => x.id !== id))
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
