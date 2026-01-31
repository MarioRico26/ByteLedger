// byteledger/src/app/estimates/ui/EstimatesTableClient.tsx
"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { EstimateStatus } from "@prisma/client"

export type EstimateRow = {
  id: string
  title: string
  status: EstimateStatus
  createdAt: string
  saleId: string | null
  totalAmount: string
  subtotalAmount: string
  taxRate: string | null
  taxAmount: string
  discountAmount: string
  itemsCount: number
  customer: { id: string; fullName: string; email: string | null; phone: string | null } | null
}

type Props = {
  initialEstimates: EstimateRow[]
}

function money(s: string) {
  const n = Number(s)
  if (!Number.isFinite(n)) return "$0.00"
  return `$${n.toFixed(2)}`
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return ""
  }
}

const STATUS_OPTIONS: Array<{ value: "ALL" | EstimateStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "DRAFT" },
  { value: "SENT", label: "SENT" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "EXPIRED", label: "EXPIRED" },
]

export default function EstimatesTableClient({ initialEstimates }: Props) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<EstimateStatus | "ALL">("ALL")
  const [onlyNotConverted, setOnlyNotConverted] = useState(false)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()

    return initialEstimates.filter((e) => {
      if (onlyNotConverted && e.saleId) return false
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
  }, [initialEstimates, q, status, onlyNotConverted])

  async function post(url: string) {
    const res = await fetch(url, { method: "POST" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || "Request failed")
    return data
  }

  async function onDuplicate(id: string) {
    try {
      const data = await post(`/api/estimates/${id}/duplicate`)
      if (data?.id) window.location.href = `/estimates/${data.id}`
    } catch (e: any) {
      alert(e?.message || "Failed to duplicate")
    }
  }

  async function onConvert(id: string) {
    if (!confirm("Convert this estimate into an invoice (sale)?")) return
    try {
      const data = await post(`/api/estimates/${id}/convert`)
      if (data?.saleId) window.location.href = `/sales/${data.saleId}`
    } catch (e: any) {
      alert(e?.message || "Failed to convert")
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-500">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title, customer, email, phone, id..."
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={onlyNotConverted}
                onChange={(e) => setOnlyNotConverted(e.target.checked)}
              />
              Only not converted
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/60 text-xs text-zinc-400">
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

            <tbody className="divide-y divide-zinc-800 bg-zinc-950/30">
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-500" colSpan={7}>
                    No estimates found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const locked = Boolean(e.saleId)

                  return (
                    <tr key={e.id} className="hover:bg-zinc-950/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">{e.title}</div>
                        <div className="text-xs text-zinc-500">#{e.id.slice(0, 8)}</div>
                      </td>

                      <td className="px-4 py-3">
                        {e.customer ? (
                          <div className="space-y-0.5">
                            <div className="text-zinc-200">{e.customer.fullName}</div>
                            <div className="text-xs text-zinc-500">
                              {[e.customer.email, e.customer.phone].filter(Boolean).join(" • ")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500">No customer</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[11px] text-zinc-300">
                          {e.status}
                        </span>
                        {e.saleId ? <div className="mt-1 text-xs text-zinc-500">Invoice linked</div> : null}
                      </td>

                      <td className="px-4 py-3 text-zinc-300">{fmtDate(e.createdAt)}</td>
                      <td className="px-4 py-3 text-zinc-300">{e.itemsCount}</td>
                      <td className="px-4 py-3 text-zinc-100">{money(e.totalAmount)}</td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/estimates/${e.id}`}
                            className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/40"
                          >
                            Details
                          </Link>

                          <Link
                            href={`/estimates/${e.id}/quote`}
                            className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/40"
                          >
                            Quote
                          </Link>

                          <button
                            onClick={() => onDuplicate(e.id)}
                            className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/40"
                          >
                            Duplicate
                          </button>

                          {locked ? (
                            <Link
                              href={`/sales/${e.saleId}`}
                              className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/40"
                            >
                              Invoice
                            </Link>
                          ) : (
                            <>
                              <Link
                                href={`/estimates/${e.id}/edit`}
                                className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/40"
                              >
                                Edit
                              </Link>

                              <button
                                onClick={() => onConvert(e.id)}
                                className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-950/50"
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
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}