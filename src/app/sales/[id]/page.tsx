// byteledger/src/app/sales/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import PrintButton from "./invoice/PrintButton"
import SendInvoiceModal from "./SendInvoiceModal"

function money(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function fmtMoney(v: any) {
  return money(v).toLocaleString(undefined, { style: "currency", currency: "USD" })
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: saleId } = await params
  const orgId = await requireOrgId()

  if (!saleId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
        <div className="font-semibold">Invoice not found</div>
        <div className="mt-2 text-sm text-slate-500">Missing sale id param.</div>
      </div>
    )
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      items: true,
      payments: { orderBy: { paidAt: "desc" } },
      emailLogs: { orderBy: { createdAt: "desc" } },
      organization: true,
    },
  })

  if (!sale) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
        <div className="font-semibold">Invoice not found</div>
        <div className="mt-2 text-sm text-slate-500">Sale ID: {saleId}</div>
      </div>
    )
  }

  if (sale.organizationId !== orgId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        Not authorized for this invoice.
        <div className="mt-2 text-xs text-rose-600">
          Sale org: {sale.organizationId} <br />
          App org: {orgId}
        </div>
      </div>
    )
  }

  const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id
    .slice(-6)
    .toUpperCase()}`

  const subtotal = money((sale as any).subtotalAmount ?? 0)
  const discount = money((sale as any).discountAmount ?? 0)
  const taxRate = money((sale as any).taxRate ?? 0)
  const tax = money((sale as any).taxAmount ?? 0)

  const total = money(sale.totalAmount ?? 0)
  const paid = money(sale.paidAmount ?? 0)
  const balance = money(sale.balanceAmount ?? 0)

  const org = sale.organization
  const orgName = org.businessName || org.name

  const cust = sale.customer
  const billToAddress = cust.workAddress || cust.homeAddress || null

  const activity = [
    {
      id: "created",
      at: sale.createdAt,
      title: "Invoice created",
      detail: `Invoice ${invoiceNumber} created`,
    },
    ...(sale.updatedAt && sale.updatedAt.getTime() - sale.createdAt.getTime() > 1000
      ? [
          {
            id: "updated",
            at: sale.updatedAt,
            title: "Invoice updated",
            detail: "Invoice details were modified",
          },
        ]
      : []),
    ...(sale.emailLogs || []).map((log: any) => ({
      id: `email-${log.id}`,
      at: log.createdAt,
      title: log.status === "FAILED" ? "Email failed" : "Invoice email sent",
      detail: `${log.subject || "Invoice email"} • ${log.to}`,
    })),
    ...(sale.payments || []).map((p: any) => ({
      id: `pay-${p.id}`,
      at: p.paidAt,
      title: "Payment received",
      detail: `${p.method} • ${fmtMoney(p.amount)}${p.notes ? ` • ${p.notes}` : ""}`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 12)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl p-8 print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">{orgName}</div>
            <h1 className="mt-1 text-2xl font-semibold">Invoice</h1>

            <div className="mt-2 text-sm text-slate-700">
              Invoice #: <span className="font-semibold">{invoiceNumber}</span>
            </div>

            <div className="text-sm text-slate-700">
              Date: <span className="font-semibold">{sale.createdAt.toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 print:hidden">
            <SendInvoiceModal saleId={sale.id} defaultTo={sale.customer.email || ""} />
            <a
              href={`/sales/${sale.id}/edit`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              Edit Invoice
            </a>
            <PrintButton />
          </div>
        </div>

        {/* From / Bill To */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">From</div>
            <div className="mt-2 text-sm font-semibold">{orgName}</div>

            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {org.email ? <div>{org.email}</div> : null}
              {org.phone ? <div>{org.phone}</div> : null}
              {org.website ? <div>{org.website}</div> : null}
            </div>

            {(org.addressLine1 ||
              org.addressLine2 ||
              org.city ||
              org.state ||
              org.zip ||
              org.country) && (
              <div className="mt-3 text-sm text-slate-700">
                <div className="font-medium text-slate-600">Address</div>
                <div className="mt-1">
                  {org.addressLine1 ? <div>{org.addressLine1}</div> : null}
                  {org.addressLine2 ? <div>{org.addressLine2}</div> : null}
                  <div>{[org.city, org.state, org.zip].filter(Boolean).join(", ")}</div>
                  {org.country ? <div>{org.country}</div> : null}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Bill To</div>
            <div className="mt-2 text-sm font-semibold">{cust.fullName}</div>

            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {cust.email ? <div>{cust.email}</div> : null}
              {cust.phone ? <div>{cust.phone}</div> : null}
              {billToAddress ? (
                <div className="pt-2">
                  <div className="text-xs font-medium text-slate-600">Address</div>
                  <div className="mt-1 text-sm text-slate-700 whitespace-pre-line">
                    {billToAddress}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Job + Summary */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Job / Description</div>
            <div className="mt-1 text-sm font-semibold">{sale.description}</div>

            {sale.poNumber && (
              <div className="mt-2 text-sm text-slate-700">
                PO: <span className="font-semibold">{sale.poNumber}</span>
              </div>
            )}

            {sale.serviceAddress && (
              <div className="mt-1 text-sm text-slate-700">
                Service Address: <span className="font-semibold">{sale.serviceAddress}</span>
              </div>
            )}

            {sale.notes && <div className="mt-2 text-sm text-slate-600">Notes: {sale.notes}</div>}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Summary</div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-semibold">{fmtMoney(subtotal)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Discount</span>
              <span className="font-semibold">-{fmtMoney(discount)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Tax ({taxRate.toFixed(3)}%)</span>
              <span className="font-semibold">{fmtMoney(tax)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
              <span>Total</span>
              <span className="font-semibold">{fmtMoney(total)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Paid</span>
              <span className="font-semibold">{fmtMoney(paid)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Remaining</span>
              <span className="font-semibold">{fmtMoney(balance)}</span>
            </div>

            <div className="mt-3">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold">
                Status: {sale.status}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-8">
          <div className="text-sm font-semibold">Items</div>
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((i: any) => (
                  <tr key={i.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3 text-slate-700">{i.type}</td>
                    <td className="px-4 py-3 text-right">{i.quantity}</td>
                    <td className="px-4 py-3 text-right">{fmtMoney(i.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtMoney(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity */}
        <div className="mt-10">
          <div className="text-sm font-semibold">Activity Timeline</div>
          <div className="mt-3 space-y-4">
            {activity.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No activity yet.
              </div>
            ) : (
              activity.map((evt: any) => (
                <div key={evt.id} className="flex gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
                  <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold">{evt.title}</div>
                      <div className="text-xs text-slate-500">
                        {evt.at.toLocaleDateString()} •{" "}
                        {evt.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{evt.detail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <div className="font-semibold text-slate-700">Thank you for your business.</div>
          <div className="mt-1">
            Powered by <span className="font-semibold">Byte Networks</span>
          </div>
        </div>
      </div>
    </div>
  )
}
