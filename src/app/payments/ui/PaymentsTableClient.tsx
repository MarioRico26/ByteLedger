"use client"

import { useMemo, useState } from "react"

export type PaymentRow = {
  id: string
  amount: string
  method: string
  paidAt: string
  notes: string | null
  saleId: string | null
  saleDescription: string | null
  saleCreatedAt: string | null
  customerName: string | null
  customerEmail: string | null
}

type Props = { initialPayments: PaymentRow[] }
type GroupKey = "none" | "method" | "month"
type ChartRange = 6 | 12

function money(n: any) {
  const v = Number(n)
  if (!Number.isFinite(v)) return "$0.00"
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function fmtDate(iso?: string | null) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.valueOf())) return ""
    return d.toLocaleDateString()
  } catch {
    return ""
  }
}

function dateAtStart(value: string) {
  return new Date(`${value}T00:00:00`)
}

function dateAtEnd(value: string) {
  return new Date(`${value}T23:59:59`)
}

export default function PaymentsTableClient({ initialPayments }: Props) {
  const [q, setQ] = useState("")
  const [method, setMethod] = useState<string>("ALL")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [groupBy, setGroupBy] = useState<GroupKey>("none")
  const [chartRange, setChartRange] = useState<ChartRange>(6)

  const methodOptions = useMemo(() => {
    const set = new Set<string>()
    initialPayments.forEach((p) => set.add(p.method))
    return ["ALL", ...Array.from(set).sort()]
  }, [initialPayments])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()

    return initialPayments.filter((p) => {
      if (method !== "ALL" && p.method !== method) return false

      if (from || to) {
        const rowDate = p.paidAt ? new Date(p.paidAt) : null
        if (!rowDate || Number.isNaN(rowDate.valueOf())) return false
        if (from) {
          const start = dateAtStart(from)
          if (rowDate < start) return false
        }
        if (to) {
          const end = dateAtEnd(to)
          if (rowDate > end) return false
        }
      }

      if (!term) return true

      const hay = [
        p.id,
        p.method,
        p.saleDescription ?? "",
        p.customerName ?? "",
        p.customerEmail ?? "",
        p.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()

      return hay.includes(term)
    })
  }, [initialPayments, q, method, from, to])

  const metrics = useMemo(() => {
    const totalReceived = filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const paymentsCount = filtered.length
    const avgPayment = paymentsCount > 0 ? totalReceived / paymentsCount : 0

    const now = new Date()
    const thisMonthTotal = filtered.reduce((sum, p) => {
      const d = p.paidAt ? new Date(p.paidAt) : null
      if (!d || Number.isNaN(d.valueOf())) return sum
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        return sum + Number(p.amount || 0)
      }
      return sum
    }, 0)

    return { totalReceived, thisMonthTotal, paymentsCount, avgPayment }
  }, [filtered])

  const grouped = useMemo(() => {
    if (groupBy === "none") return null

    const map = new Map<string, PaymentRow[]>()
    for (const row of filtered) {
      let key = ""
      if (groupBy === "method") {
        key = row.method || "Unknown"
      } else {
        const d = row.paidAt ? new Date(row.paidAt) : null
        if (!d || Number.isNaN(d.valueOf())) {
          key = "Unknown"
        } else {
          const m = String(d.getMonth() + 1).padStart(2, "0")
          key = `${d.getFullYear()}-${m}`
        }
      }
      const list = map.get(key) || []
      list.push(row)
      map.set(key, list)
    }

    if (groupBy === "method") {
      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, rows]) => ({ key, label: key, rows }))
    }

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, rows]) => {
        if (key === "Unknown") return { key, label: "Unknown month", rows }
        const [y, m] = key.split("-")
        const d = new Date(Number(y), Number(m) - 1, 1)
        const label = d.toLocaleString(undefined, { month: "short", year: "numeric" })
        return { key, label, rows }
      })
  }, [filtered, groupBy])

  const monthlyChart = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of filtered) {
      const d = p.paidAt ? new Date(p.paidAt) : null
      if (!d || Number.isNaN(d.valueOf())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      map.set(key, (map.get(key) || 0) + Number(p.amount || 0))
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    const trimmed = entries.length > chartRange ? entries.slice(-chartRange) : entries
    const max = trimmed.reduce((m, [, v]) => Math.max(m, v), 0)
    const points = trimmed.map(([key, value]) => {
      const [y, m] = key.split("-")
      const d = new Date(Number(y), Number(m) - 1, 1)
      return {
        key,
        label: d.toLocaleString(undefined, { month: "short" }),
        year: d.getFullYear(),
        value,
        height: max > 0 ? Math.round((value / max) * 100) : 0,
      }
    })
    return { points, max }
  }, [filtered, chartRange])

  const methodTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of filtered) {
      const key = p.method || "Unknown"
      map.set(key, (map.get(key) || 0) + Number(p.amount || 0))
    }
    return Array.from(map.entries())
      .map(([key, total]) => ({ key, total }))
      .sort((a, b) => b.total - a.total)
  }, [filtered])

  function invoiceNumber(saleId: string | null, saleCreatedAt: string | null) {
    if (!saleId) return null
    const year = saleCreatedAt ? new Date(saleCreatedAt).getFullYear() : null
    const suffix = saleId.slice(-6).toUpperCase()
    return year ? `INV-${year}-${suffix}` : `INV-${suffix}`
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Total received</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {money(metrics.totalReceived)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Payments this month</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {money(metrics.thisMonthTotal)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Payments count</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.paymentsCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Avg payment</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {money(metrics.avgPayment)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">Monthly volume</div>
            <div className="mt-1 text-sm text-slate-700">
              Last {monthlyChart.points.length} month(s)
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">Peak: {money(monthlyChart.max)}</div>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(Number(e.target.value) as ChartRange)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-400"
            >
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="flex h-32 items-end gap-3">
            {monthlyChart.points.length === 0 ? (
              <div className="text-sm text-slate-500">No data yet.</div>
            ) : (
              monthlyChart.points.map((p) => (
                <div key={p.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative group flex h-24 w-full items-end rounded-full bg-slate-100 p-1">
                    <div
                      className="w-full rounded-full bg-gradient-to-b from-teal-400 to-teal-600"
                      style={{ height: `${Math.max(p.height, 6)}%` }}
                    />
                    <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {money(p.value)}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">{p.label}</div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">By method</div>
            <div className="mt-3 space-y-2 text-sm">
              {methodTotals.length === 0 ? (
                <div className="text-slate-500">No data.</div>
              ) : (
                methodTotals.map((m) => (
                  <div key={m.key} className="flex items-center justify-between">
                    <span className="text-slate-600">{m.key}</span>
                    <span className="font-semibold text-slate-900">{money(m.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Customer, sale, method, notes, id..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              {methodOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <label className="mt-3 text-xs text-slate-500">Group by</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupKey)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="none">None</option>
              <option value="method">Method</option>
              <option value="month">Month</option>
            </select>
          </div>

          <div className="grid gap-3">
            <div>
              <label className="text-xs text-slate-500">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 text-right text-xs text-slate-500">
          {filtered.length} result(s)
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 min-w-[180px]">Payment</th>
                <th className="px-4 py-3 min-w-[220px]">Invoice / Sale</th>
                <th className="px-4 py-3 min-w-[200px]">Customer</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right w-[200px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {(grouped ? grouped.flatMap((g) => g.rows) : filtered).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    No payments found.
                  </td>
                </tr>
              ) : (
                (grouped ? grouped : [{ key: "All", label: "All", rows: filtered }]).flatMap((group) => {
                  const rows = group.rows
                  const groupHeader =
                    groupBy === "none" ? null : (
                      <tr key={`group-${group.key}`} className="bg-slate-50">
                        <td className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400" colSpan={5}>
                          {group.label} • {rows.length}
                        </td>
                      </tr>
                    )

                  const dataRows = rows.map((p) => {
                    const paidAt = fmtDate(p.paidAt)
                    const saleId = p.saleId
                    const inv = invoiceNumber(p.saleId, p.saleCreatedAt)
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{money(p.amount)}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">
                              {p.method}
                            </span>
                            {paidAt ? (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-500">
                                {paidAt}
                              </span>
                            ) : null}
                          </div>
                        </td>

                      <td className="px-4 py-4">
                        <div className="text-slate-700">{p.saleDescription || "Unknown sale"}</div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {inv && saleId ? (
                            <a
                              href={`/sales/${saleId}/invoice`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-700"
                            >
                              Invoice: {inv}
                            </a>
                          ) : (
                            <span>Invoice: —</span>
                          )}
                        </div>
                      </td>

                        <td className="px-4 py-4">
                          <div className="text-slate-700">{p.customerName || "Unknown customer"}</div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {p.customerEmail || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {p.notes || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                              <a
                                href={`/payments/${p.id}/receipt`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-teal-400"
                              >
                                Receipt
                              </a>
                              {saleId ? (
                                <a
                                  href={`/sales/${saleId}/invoice`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                >
                                  Invoice
                                </a>
                              ) : (
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                                  No invoice
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })

                  return groupHeader ? [groupHeader, ...dataRows] : dataRows
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
