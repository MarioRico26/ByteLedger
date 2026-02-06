import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import ReportsActions from "./ui/ReportsActions"

export const dynamic = "force-dynamic"

type SearchParams = {
  range?: string
  from?: string
  to?: string
}

function toMoney(v: number) {
  if (!Number.isFinite(v)) return "$0.00"
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function parseDateInput(v?: string | null) {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function endOfDay(d: Date) {
  const end = new Date(d)
  end.setHours(23, 59, 59, 999)
  return end
}

function daysBetween(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const orgId = await requireOrgId()
  const now = new Date()
  const range = searchParams.range || "last30"

  let start = new Date(now)
  let end = endOfDay(now)

  if (range === "thisMonth") {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
    end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  } else if (range === "lastMonth") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
  } else if (range === "ytd") {
    start = new Date(now.getFullYear(), 0, 1)
  } else if (range === "custom") {
    const from = parseDateInput(searchParams.from)
    const to = parseDateInput(searchParams.to)
    if (from) start = from
    if (to) end = endOfDay(to)
  } else {
    start.setDate(now.getDate() - 30)
  }

  const periodDays = Math.max(1, daysBetween(end, start) + 1)
  const prevStart = new Date(start)
  prevStart.setDate(prevStart.getDate() - periodDays)
  const prevEnd = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1))

  const [sales, payments, openSales, prevSales, prevPayments] = await Promise.all([
    prisma.sale.findMany({
      where: { organizationId: orgId, saleDate: { gte: start, lte: end } },
      include: { customer: true },
      orderBy: { saleDate: "desc" },
    }),
    prisma.payment.findMany({
      where: { organizationId: orgId, paidAt: { gte: start, lte: end } },
      orderBy: { paidAt: "desc" },
    }),
    prisma.sale.findMany({
      where: { organizationId: orgId, balanceAmount: { gt: 0 } },
      select: { id: true, dueDate: true, saleDate: true, balanceAmount: true, customer: { select: { fullName: true } } },
    }),
    prisma.sale.findMany({
      where: { organizationId: orgId, saleDate: { gte: prevStart, lte: prevEnd } },
      select: { totalAmount: true, taxAmount: true },
    }),
    prisma.payment.findMany({
      where: { organizationId: orgId, paidAt: { gte: prevStart, lte: prevEnd } },
      select: { amount: true },
    }),
  ])

  const totalInvoiced = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)
  const totalTax = sales.reduce((sum, s) => sum + Number(s.taxAmount || 0), 0)
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const outstanding = openSales.reduce((sum, s) => sum + Number(s.balanceAmount || 0), 0)

  const avgInvoice = sales.length ? totalInvoiced / sales.length : 0
  const prevInvoiced = prevSales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)
  const prevTax = prevSales.reduce((sum, s) => sum + Number(s.taxAmount || 0), 0)
  const prevPaymentsTotal = prevPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

  function pctChange(current: number, prev: number) {
    if (!prev) return current ? 100 : 0
    return ((current - prev) / prev) * 100
  }

  const topCustomers = (() => {
    const map = new Map<string, { name: string; total: number }>()
    for (const s of sales) {
      const key = s.customerId
      const current = map.get(key) || { name: s.customer.fullName, total: 0 }
      current.total += Number(s.totalAmount || 0)
      map.set(key, current)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5)
  })()

  const paymentMethods = (() => {
    const map = new Map<string, number>()
    for (const p of payments) {
      const key = p.method
      map.set(key, (map.get(key) || 0) + Number(p.amount || 0))
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([method, amount]) => ({ method, amount }))
  })()

  const aging = (() => {
    const buckets = {
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    }
    for (const s of openSales) {
      const baseDate = s.dueDate || s.saleDate || now
      const age = Math.max(0, daysBetween(now, baseDate))
      const amt = Number(s.balanceAmount || 0)
      if (age <= 30) buckets["0-30"] += amt
      else if (age <= 60) buckets["31-60"] += amt
      else if (age <= 90) buckets["61-90"] += amt
      else buckets["90+"] += amt
    }
    return buckets
  })()

  const months: { key: string; label: string }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end && months.length < 18) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
    months.push({
      key,
      label: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const salesByMonth: Record<string, number> = {}
  const paymentsByMonth: Record<string, number> = {}
  for (const m of months) {
    salesByMonth[m.key] = 0
    paymentsByMonth[m.key] = 0
  }
  for (const s of sales) {
    const d = s.saleDate || s.createdAt || now
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key in salesByMonth) salesByMonth[key] += Number(s.totalAmount || 0)
  }
  for (const p of payments) {
    const d = p.paidAt
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key in paymentsByMonth) paymentsByMonth[key] += Number(p.amount || 0)
  }

  const chartRows = months.map((m) => ({
    label: m.label,
    sales: salesByMonth[m.key],
    payments: paymentsByMonth[m.key],
  }))
  const chartMax = Math.max(1, ...chartRows.map((r) => Math.max(r.sales, r.payments)))

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-400">Reports</div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Financial overview</h1>
            <p className="mt-1 text-sm text-slate-500">
              Drill into revenue, payments, aging, and customer performance.
            </p>
          </div>
          <ReportsActions
            exportHref={`/api/reports/export?range=${encodeURIComponent(range)}${
              searchParams.from ? `&from=${encodeURIComponent(searchParams.from)}` : ""
            }${searchParams.to ? `&to=${encodeURIComponent(searchParams.to)}` : ""}`}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {[
            { label: "Last 30 days", value: "last30" },
            { label: "This month", value: "thisMonth" },
            { label: "Last month", value: "lastMonth" },
            { label: "YTD", value: "ytd" },
          ].map((opt) => (
            <Link
              key={opt.value}
              href={`/reports?range=${opt.value}`}
              className={[
                "rounded-full border px-3 py-1",
                range === opt.value
                  ? "border-teal-400/60 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {opt.label}
            </Link>
          ))}
          <span className="text-slate-500">Custom:</span>
          <form action="/reports" method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="range" value="custom" />
            <input
              type="date"
              name="from"
              defaultValue={searchParams.from || ""}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
            />
            <input
              type="date"
              name="to"
              defaultValue={searchParams.to || ""}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
            />
            <button className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-slate-300">
              Apply
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-slate-400">Invoiced</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{toMoney(totalInvoiced)}</div>
          <div className="mt-1 text-xs text-slate-500">
            {sales.length} invoices • {pctChange(totalInvoiced, prevInvoiced).toFixed(1)}% vs prior
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-slate-400">Collected</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{toMoney(totalPayments)}</div>
          <div className="mt-1 text-xs text-slate-500">
            {payments.length} payments • {pctChange(totalPayments, prevPaymentsTotal).toFixed(1)}% vs prior
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-slate-400">Outstanding</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{toMoney(outstanding)}</div>
          <div className="mt-1 text-xs text-slate-500">Open balances</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-slate-400">Avg Invoice</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{toMoney(avgInvoice)}</div>
          <div className="mt-1 text-xs text-slate-500">Avg size per invoice</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-900">Revenue vs Payments</div>
          <div className="mt-1 text-xs text-slate-500">Monthly trend</div>
          <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
            {chartRows.map((row) => {
              const salesPct = Math.round((row.sales / chartMax) * 100)
              const payPct = Math.round((row.payments / chartMax) * 100)
              return (
                <div key={row.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end gap-1 md:h-32">
                    <div
                      className="w-1/2 rounded-lg bg-emerald-400/80"
                      style={{ height: `${Math.max(6, salesPct)}%` }}
                    />
                    <div
                      className="w-1/2 rounded-lg bg-sky-400/80"
                      style={{ height: `${Math.max(6, payPct)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">{row.label}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Invoiced
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400/80" /> Payments
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-900">Tax collected</div>
          <div className="mt-1 text-xs text-slate-500">Based on invoices</div>
          <div className="mt-4 text-2xl font-semibold text-amber-600">{toMoney(totalTax)}</div>
          <div className="mt-2 text-xs text-slate-500">
            {pctChange(totalTax, prevTax).toFixed(1)}% vs prior period
          </div>

          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest text-slate-400">A/R aging</div>
            <div className="mt-3 space-y-2 text-sm">
              {Object.entries(aging).map(([bucket, amount]) => (
                <div key={bucket} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">{bucket} days</span>
                  <span className="font-semibold text-slate-900">{toMoney(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-900">Top customers</div>
          <div className="mt-1 text-xs text-slate-500">Highest revenue in range</div>
          <div className="mt-4 space-y-3">
            {topCustomers.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                No customer activity in this range.
              </div>
            ) : (
              topCustomers.map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-sm text-slate-700">{c.name}</div>
                  <div className="text-sm font-semibold text-slate-900">{toMoney(c.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-900">Payment methods</div>
          <div className="mt-1 text-xs text-slate-500">Distribution by method</div>
          <div className="mt-4 space-y-3">
            {paymentMethods.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                No payments in this range.
              </div>
            ) : (
              paymentMethods.map((m) => (
                <div key={m.method} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-sm text-slate-700">{m.method}</div>
                  <div className="text-sm font-semibold text-slate-900">{toMoney(m.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
