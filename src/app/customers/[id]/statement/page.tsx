import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import PrintStatementButton from "./PrintStatementButton"

function money(v: any) {
  const n = Number(v)
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
    : "$0.00"
}

function fmtDate(v: Date | string | null | undefined) {
  if (!v) return "—"
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.valueOf())) return "—"
  return d.toLocaleDateString()
}

export default async function CustomerStatementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const orgId = await requireOrgId()

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: orgId },
    include: {
      sales: {
        orderBy: { saleDate: "asc" },
        include: {
          payments: { orderBy: { paidAt: "asc" } },
        },
      },
    },
  })

  if (!customer) {
    return <div className="p-6 text-sm text-slate-500">Customer not found.</div>
  }

  const entries = customer.sales.flatMap((sale) => {
    const saleDate = sale.saleDate || sale.createdAt
    const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id.slice(-6).toUpperCase()}`
    const invoiceEntry = {
      id: `sale-${sale.id}`,
      date: saleDate,
      type: "Invoice",
      reference: invoiceNumber,
      description: sale.description || "Invoice",
      debit: Number(sale.totalAmount || 0),
      credit: 0,
      sortWeight: 0,
    }
    const paymentEntries = (sale.payments || []).map((payment) => ({
      id: `payment-${payment.id}`,
      date: payment.paidAt,
      type: "Payment",
      reference: `RCP-${payment.paidAt.getFullYear()}-${payment.id.slice(-6).toUpperCase()}`,
      description: `${payment.method}${payment.notes ? ` • ${payment.notes}` : ""}`,
      debit: 0,
      credit: Number(payment.amount || 0),
      sortWeight: 1,
    }))
    return [invoiceEntry, ...paymentEntries]
  }).sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime()
    if (diff !== 0) return diff
    return a.sortWeight - b.sortWeight
  })

  let runningBalance = 0
  const rows = entries.map((entry) => {
    runningBalance += entry.debit - entry.credit
    return { ...entry, runningBalance }
  })

  const totalInvoiced = rows.reduce((sum, row) => sum + row.debit, 0)
  const totalPaid = rows.reduce((sum, row) => sum + row.credit, 0)
  const outstanding = Math.max(totalInvoiced - totalPaid, 0)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl p-8 print:p-0">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Customer Statement</div>
            <h1 className="mt-1 text-2xl font-semibold">{customer.fullName}</h1>
            <div className="mt-2 text-sm text-slate-600">
              {customer.email || "No email"}
              {customer.phone ? ` • ${customer.phone}` : ""}
            </div>
          </div>
          <PrintStatementButton />
        </div>

        <div className="hidden border-b border-slate-200 pb-6 print:block">
          <div className="text-xs uppercase tracking-widest text-slate-500">Customer Statement</div>
          <h1 className="mt-1 text-2xl font-semibold">{customer.fullName}</h1>
          <div className="mt-2 text-sm text-slate-600">
            {customer.email || "No email"}
            {customer.phone ? ` • ${customer.phone}` : ""}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">Total invoiced</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{money(totalInvoiced)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">Total paid</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{money(totalPaid)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">Outstanding</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{money(outstanding)}</div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Charge</th>
                <th className="px-4 py-3 text-right">Payment</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-slate-500">
                    No statement activity yet.
                  </td>
                </tr>
              ) : rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{fmtDate(row.date)}</td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{row.reference}</td>
                  <td className="px-4 py-3 text-slate-600">{row.description}</td>
                  <td className="px-4 py-3 text-right">{row.debit ? money(row.debit) : "—"}</td>
                  <td className="px-4 py-3 text-right">{row.credit ? money(row.credit) : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{money(row.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
