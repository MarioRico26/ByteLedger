import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"

export const dynamic = "force-dynamic"

function toMoney(v: number) {
  if (!Number.isFinite(v)) return "$0.00"
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function fmtShortDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

type SearchParams = {
  range?: string
}

function getRangeStart(range: string, now: Date) {
  if (range === "last7") {
    const d = new Date(now)
    d.setDate(now.getDate() - 7)
    return d
  }
  if (range === "last90") {
    const d = new Date(now)
    d.setDate(now.getDate() - 90)
    return d
  }
  if (range === "ytd") {
    return new Date(now.getFullYear(), 0, 1)
  }
  // default last 30
  const d = new Date(now)
  d.setDate(now.getDate() - 30)
  return d
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const orgId = await requireOrgId()
  const now = new Date()
  const range = searchParams.range || "last30"
  const rangeStart = getRangeStart(range, now)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [
    salesRangeAgg,
    paymentsRangeAgg,
    openBalances,
    overdueCount,
    recentSales,
    recentPayments,
    recentEmails,
    salesInRange,
    openSales,
  ] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { organizationId: orgId, saleDate: { gte: rangeStart } },
        _sum: { totalAmount: true, taxAmount: true },
      }),
      prisma.payment.aggregate({
        where: { organizationId: orgId, paidAt: { gte: rangeStart } },
        _sum: { amount: true },
      }),
      prisma.sale.aggregate({
        where: { organizationId: orgId, balanceAmount: { gt: 0 } },
        _sum: { balanceAmount: true },
      }),
      prisma.sale.count({
        where: {
          organizationId: orgId,
          balanceAmount: { gt: 0 },
          dueDate: { lt: now },
        },
      }),
      prisma.sale.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          description: true,
          createdAt: true,
          totalAmount: true,
          customer: { select: { fullName: true } },
        },
      }),
      prisma.payment.findMany({
        where: { organizationId: orgId },
        orderBy: { paidAt: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          paidAt: true,
          method: true,
          sale: { select: { id: true, description: true } },
        },
      }),
      prisma.emailLog.findMany({
        where: { organizationId: orgId, saleId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          status: true,
          subject: true,
          sale: { select: { id: true, description: true } },
        },
      }),
      prisma.sale.findMany({
        where: { organizationId: orgId, saleDate: { gte: rangeStart } },
        orderBy: { saleDate: "desc" },
        select: {
          id: true,
          totalAmount: true,
          customerId: true,
          customer: { select: { fullName: true } },
        },
      }),
      prisma.sale.findMany({
        where: { organizationId: orgId, balanceAmount: { gt: 0 } },
        select: { balanceAmount: true, dueDate: true, saleDate: true },
      }),
    ])

  const activity = [
    ...recentSales.map((s: (typeof recentSales)[number]) => ({
      id: `sale-${s.id}`,
      at: s.createdAt,
      title: "Invoice created",
      subtitle: `${s.description} • ${s.customer.fullName}`,
      amount: Number(s.totalAmount || 0),
    })),
    ...recentPayments.map((p: (typeof recentPayments)[number]) => ({
      id: `pay-${p.id}`,
      at: p.paidAt,
      title: "Payment received",
      subtitle: `${p.sale?.description || "Invoice"} • ${p.method}`,
      amount: Number(p.amount || 0),
    })),
    ...recentEmails.map((e: (typeof recentEmails)[number]) => ({
      id: `email-${e.id}`,
      at: e.createdAt,
      title: e.status === "FAILED" ? "Email failed" : "Email sent",
      subtitle: `${e.subject || "Invoice email"} • ${e.sale?.description || "Invoice"}`,
      amount: null,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8)

  const earliest = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const [salesForChart, paymentsForChart] = await Promise.all([
    prisma.sale.findMany({
      where: { organizationId: orgId, saleDate: { gte: earliest, lt: nextMonth } },
      select: { saleDate: true, createdAt: true, totalAmount: true },
    }),
    prisma.payment.findMany({
      where: { organizationId: orgId, paidAt: { gte: earliest, lt: nextMonth } },
      select: { paidAt: true, amount: true },
    }),
  ])

  const months: { label: string; key: string; start: Date }[] = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    months.push({
      label: d.toLocaleDateString(undefined, { month: "short" }),
      key,
      start: d,
    })
  }

  const salesByMonth: Record<string, number> = {}
  const paymentsByMonth: Record<string, number> = {}

  for (const m of months) {
    salesByMonth[m.key] = 0
    paymentsByMonth[m.key] = 0
  }

  for (const s of salesForChart) {
    const d = s.saleDate || s.createdAt || now
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key in salesByMonth) {
      salesByMonth[key] += Number(s.totalAmount || 0)
    }
  }
  for (const p of paymentsForChart) {
    const d = p.paidAt
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key in paymentsByMonth) {
      paymentsByMonth[key] += Number(p.amount || 0)
    }
  }

  const chartRows = months.map((m: any) => ({
    label: m.label,
    sales: salesByMonth[m.key],
    payments: paymentsByMonth[m.key],
  }))
  const chartMax = Math.max(
    1,
    ...chartRows.map((r: any) => Math.max(r.sales, r.payments))
  )

  const topCustomers = (() => {
    const map = new Map<string, { name: string; total: number }>()
    for (const s of salesInRange) {
      const current = map.get(s.customerId) || {
        name: s.customer?.fullName || "Unknown",
        total: 0,
      }
      current.total += Number(s.totalAmount || 0)
      map.set(s.customerId, current)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5)
  })()

  const aging = (() => {
    const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 }
    for (const s of openSales) {
      const baseDate = s.dueDate || s.saleDate || now
      const age = Math.max(0, Math.floor((now.getTime() - baseDate.getTime()) / 86400000))
      const amt = Number(s.balanceAmount || 0)
      if (age <= 30) buckets["0-30"] += amt
      else if (age <= 60) buckets["31-60"] += amt
      else if (age <= 90) buckets["61-90"] += amt
      else buckets["90+"] += amt
    }
    return buckets
  })()

  const upcoming = await prisma.sale.findMany({
    where: {
      organizationId: orgId,
      balanceAmount: { gt: 0 },
      dueDate: { gte: now, lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15) },
    },
    orderBy: { dueDate: "asc" },
    take: 6,
    select: {
      id: true,
      description: true,
      dueDate: true,
      balanceAmount: true,
      customer: { select: { fullName: true } },
    },
  })

  const Card = ({ href, title, desc }: { href: string; title: string; desc: string }) => (
    <Link
      href={href}
      className="card card-stripe card-animate p-5 transition hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
    >
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{desc}</div>
    </Link>
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">
            Snapshot of sales, payments, and cash position.
          </div>
        </div>
        <Link
          href="/reports"
          className="btn-accent inline-flex items-center justify-center px-4 py-2 text-sm"
        >
          Open Reports
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {[
          { label: "Last 7 days", value: "last7" },
          { label: "Last 30 days", value: "last30" },
          { label: "Last 90 days", value: "last90" },
          { label: "YTD", value: "ytd" },
        ].map((opt: any) => (
          <Link
            key={opt.value}
            href={`/?range=${opt.value}`}
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
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card card-stripe card-animate p-5" style={{ animationDelay: "40ms" }}>
          <div className="text-xs uppercase tracking-widest text-slate-400">Invoiced</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {toMoney(Number(salesRangeAgg._sum.totalAmount || 0))}
          </div>
          <div className="mt-1 text-xs text-slate-500">Revenue in selected range</div>
        </div>
        <div className="card card-stripe card-animate p-5" style={{ animationDelay: "90ms" }}>
          <div className="text-xs uppercase tracking-widest text-slate-400">Collected</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {toMoney(Number(paymentsRangeAgg._sum.amount || 0))}
          </div>
          <div className="mt-1 text-xs text-slate-500">Payments in selected range</div>
        </div>
        <div className="card card-stripe card-animate p-5" style={{ animationDelay: "140ms" }}>
          <div className="text-xs uppercase tracking-widest text-slate-400">Outstanding</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {toMoney(Number(openBalances._sum.balanceAmount || 0))}
          </div>
          <div className="mt-1 text-xs text-slate-500">Open balances today</div>
        </div>
        <div className="card card-stripe card-animate p-5" style={{ animationDelay: "190ms" }}>
          <div className="text-xs uppercase tracking-widest text-slate-400">Overdue</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{overdueCount}</div>
          <div className="mt-1 text-xs text-slate-500">Past due invoices</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card card-stripe card-animate p-5" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Revenue vs Payments</div>
              <div className="text-xs text-slate-500">Last 6 months</div>
            </div>
            <div className="text-xs text-slate-500">Updated {fmtShortDate(now)}</div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
            {chartRows.map((row: any, idx: number) => {
              const salesPct = Math.round((row.sales / chartMax) * 100)
              const payPct = Math.round((row.payments / chartMax) * 100)
              return (
                <div key={row.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end gap-1 md:h-32">
                    <div
                      className="bar-animate w-1/2 rounded-lg bg-blue-500/80"
                      style={{
                        height: `${Math.max(6, salesPct)}%`,
                        animationDelay: `${idx * 40}ms`,
                      }}
                    />
                    <div
                      className="bar-animate w-1/2 rounded-lg bg-amber-400/80"
                      style={{
                        height: `${Math.max(6, payPct)}%`,
                        animationDelay: `${idx * 40 + 120}ms`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">{row.label}</div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500/80" /> Invoiced
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400/80" /> Payments
            </div>
          </div>
        </div>

        <div className="card card-stripe card-animate p-5" style={{ animationDelay: "140ms" }}>
          <div className="text-sm font-semibold text-slate-900">Upcoming due</div>
          <div className="mt-1 text-xs text-slate-500">Next 14 days</div>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                No invoices due soon.
              </div>
            ) : (
              upcoming.map((item: (typeof upcoming)[number]) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)]"
                >
                  <div className="text-sm font-semibold text-slate-900">{item.description}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{item.customer.fullName}</span>
                    <span>Due {item.dueDate ? fmtShortDate(item.dueDate) : "—"}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-rose-600">
                    {toMoney(Number(item.balanceAmount || 0))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card card-stripe card-animate rounded-2xl p-5" style={{ animationDelay: "60ms" }}>
          <div className="text-sm font-semibold text-slate-900">Recent activity</div>
          <div className="mt-1 text-xs text-slate-500">Latest movements in your account</div>
          <div className="mt-4 space-y-3">
            {activity.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                No activity yet.
              </div>
            ) : (
              activity.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)]"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.subtitle}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">{fmtShortDate(a.at)}</div>
                    {a.amount !== null ? (
                      <div className="text-sm font-semibold text-slate-900">{toMoney(a.amount)}</div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card card-stripe card-animate rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
            <div className="text-sm font-semibold text-slate-900">A/R aging</div>
            <div className="mt-1 text-xs text-slate-500">Open balances by days overdue</div>
            <div className="mt-4 space-y-2 text-sm">
              {Object.entries(aging).map(([bucket, amount]) => (
                <div
                  key={bucket}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-slate-600">{bucket} days</span>
                  <span className="font-semibold text-slate-900">{toMoney(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-stripe card-animate rounded-2xl p-5" style={{ animationDelay: "180ms" }}>
            <div className="text-sm font-semibold text-slate-900">Top customers</div>
            <div className="mt-1 text-xs text-slate-500">Highest revenue in selected range</div>
            <div className="mt-4 space-y-2 text-sm">
              {topCustomers.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No customer activity in this range.
                </div>
              ) : (
                topCustomers.map((c: any) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="text-sm text-slate-700">{c.name}</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {toMoney(c.total)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card card-stripe card-animate rounded-2xl p-5" style={{ animationDelay: "140ms" }}>
        <div className="text-sm font-semibold text-slate-900">Quick access</div>
        <div className="mt-1 text-xs text-slate-500">Go straight to a module</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Card href="/customers" title="Customers" desc="Manage customer profiles." />
          <Card href="/products" title="Catalog" desc="Products & services pricing." />
          <Card href="/estimates" title="Estimates" desc="Create quotes and send to clients." />
          <Card href="/sales" title="Sales" desc="Invoices and payments tracking." />
          <Card href="/payments" title="Payments" desc="Log and reconcile payments." />
          <Card href="/reports" title="Reports" desc="Performance & cash flow." />
        </div>
      </div>
    </div>
  )
}
