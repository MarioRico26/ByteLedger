"use client"

import { useMemo, useState } from "react"
type EstimateStatus = "DRAFT" | "SENT" | "APPROVED" | "EXPIRED"

export type EstimateRow = {
  id: string
  title: string
  status: EstimateStatus
  createdAt: string
  saleId: string | null
  totalAmount: string
  subtotalAmount: string
  taxRate: string
  taxAmount: string
  discountAmount: string
  itemsCount: number
  customer: { id: string; fullName: string; email: string | null; phone: string | null } | null
}

type Props = { initialEstimates: EstimateRow[] }
type SortKey = "date_desc" | "date_asc" | "total_desc" | "total_asc" | "customer_asc" | "status"
type GroupKey = "none" | "status" | "customer"

function money(s: string) {
  const n = Number(s)
  if (!Number.isFinite(n)) return "$0.00"
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return ""
  }
}

function go(path: string) {
  window.location.assign(path)
}

function statusBadge(status: EstimateStatus) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "SENT":
      return "border-sky-200 bg-sky-50 text-sky-700"
    case "EXPIRED":
      return "border-rose-200 bg-rose-50 text-rose-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

export default function EstimatesTableClient({ initialEstimates }: Props) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<EstimateStatus | "ALL">("ALL")
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>("date_desc")
  const [groupBy, setGroupBy] = useState<GroupKey>("none")

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()

    return initialEstimates.filter((e: any) => {
      if (onlyOpen && e.saleId) return false
      if (status !== "ALL" && e.status !== status) return false
      if (!term) return true

      const hay = [
        e.title,
        e.id,
        e.customer?.fullName ?? "",
        e.customer?.email ?? "",
        e.customer?.phone ?? "",
        e.status,
      ]
        .join(" ")
        .toLowerCase()

      return hay.includes(term)
    })
  }, [initialEstimates, q, status, onlyOpen])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === "date_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === "total_desc") return Number(b.totalAmount) - Number(a.totalAmount)
      if (sortBy === "total_asc") return Number(a.totalAmount) - Number(b.totalAmount)
      if (sortBy === "customer_asc") {
        return (a.customer?.fullName || "").localeCompare(b.customer?.fullName || "")
      }
      if (sortBy === "status") return a.status.localeCompare(b.status)
      return 0
    })
    return copy
  }, [filtered, sortBy])

  const grouped = useMemo(() => {
    if (groupBy === "none") return null
    const map = new Map<string, EstimateRow[]>()
    for (const row of sorted) {
      const key =
        groupBy === "status"
          ? row.status
          : row.customer?.fullName || "No customer"
      const list = map.get(key) || []
      list.push(row)
      map.set(key, list)
    }

    if (groupBy === "status") {
      const order = ["APPROVED", "SENT", "DRAFT", "EXPIRED"]
      return order
        .filter((k: any) => map.has(k))
        .map((k: any) => ({ key: k, rows: map.get(k)! }))
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, rows]) => ({ key, rows }))
  }, [groupBy, sorted])

  async function post(url: string) {
    const res = await fetch(url, { method: "POST" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || "Request failed")
    return data
  }

  async function onDuplicate(id: string) {
    try {
      const data = await post(`/api/estimates/${id}/duplicate`)
      if (data?.id) go(`/estimates/${data.id}/edit`)
    } catch (e: any) {
      alert(e?.message || "Failed to duplicate")
    }
  }

  async function onConvert(id: string) {
    if (!confirm("Convert this estimate into an invoice (sale)?")) return
    try {
      const data = await post(`/api/estimates/${id}/convert`)
      if (data?.saleId) go(`/sales/${data.saleId}`)
    } catch (e: any) {
      alert(e?.message || "Failed to convert")
    }
  }

  function safeId(raw: any) {
    return String(raw ?? "").trim()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title, customer, email, phone, id..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EstimateStatus | "ALL")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="ALL">All</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>

            <label className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
              Only not converted
            </label>
          </div>

          <div className="grid gap-3">
            <label className="text-xs text-slate-500">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="date_desc">Date (newest)</option>
              <option value="date_asc">Date (oldest)</option>
              <option value="total_desc">Total (high to low)</option>
              <option value="total_asc">Total (low to high)</option>
              <option value="customer_asc">Customer (A–Z)</option>
              <option value="status">Status</option>
            </select>

            <label className="text-xs text-slate-500">Group by</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupKey)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="none">None</option>
              <option value="status">Status</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">Estimate</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {(grouped ? grouped.flatMap((g) => g.rows) : sorted).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>
                    No estimates found.
                  </td>
                </tr>
              ) : (
                (grouped ? grouped : [{ key: "All", rows: sorted }]).flatMap((group) => {
                  const rows = group.rows
                  const groupHeader = (
                    <tr key={`group-${group.key}`} className="bg-slate-50">
                      <td className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400" colSpan={7}>
                        {group.key} • {rows.length}
                      </td>
                    </tr>
                  )

                  const dataRows = rows.map((e: any) => {
                    const id = safeId(e.id)
                    const locked = Boolean(e.saleId)

                    return (
                      <tr key={id || Math.random().toString(16)} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{e.title}</div>
                          <div className="text-xs text-slate-400">
                            #{id ? id.slice(0, 8) : "INVALID_ID"}
                          </div>
                          {!id ? (
                            <div className="mt-1 text-xs text-rose-500">
                              Debug: este estimate viene con id vacío. Eso NO debería existir.
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3">
                          {e.customer ? (
                            <div className="space-y-0.5">
                              <div className="text-slate-700">{e.customer.fullName}</div>
                              <div className="text-xs text-slate-400">
                                {[e.customer.email, e.customer.phone].filter(Boolean).join(" • ")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">No customer</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusBadge(e.status)}`}>
                            {e.status}
                          </span>
                          {locked ? <div className="mt-1 text-xs text-slate-400">Converted</div> : null}
                        </td>

                        <td className="px-4 py-3 text-slate-600">{fmtDate(e.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-600">{e.itemsCount}</td>
                        <td className="px-4 py-3 text-slate-900">{money(e.totalAmount)}</td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!id) return alert("Este estimate tiene id vacío. Revisa DB/seed.")
                                go(`/estimates/${encodeURIComponent(id)}/quote`)
                              }}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            >
                              Quote
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!id) return alert("Este estimate tiene id vacío. Revisa DB/seed.")
                                onDuplicate(id)
                              }}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            >
                              Duplicate
                            </button>

                            {locked ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!e.saleId) return
                                  go(`/sales/${encodeURIComponent(e.saleId)}`)
                                }}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                              >
                                Invoice
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!id) return alert("Este estimate tiene id vacío. Revisa DB/seed.")
                                    go(`/estimates/${encodeURIComponent(id)}/edit`)
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!id) return alert("Este estimate tiene id vacío. Revisa DB/seed.")
                                    onConvert(id)
                                  }}
                                  className="rounded-full bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-400"
                                >
                                  Convert
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })

                  return [groupHeader, ...dataRows]
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
