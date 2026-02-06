import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import PrintButton from "./PrintButton"
import SendInvoiceModal from "../SendInvoiceModal"

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

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      items: true,
      payments: { orderBy: { paidAt: "desc" } },
      organization: true,
    },
  })

  if (!sale) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
        <div className="font-semibold">Invoice not found</div>
      </div>
    )
  }

  if (sale.organizationId !== orgId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        Not authorized.
      </div>
    )
  }

  const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id.slice(-6).toUpperCase()}`
  const orgName = sale.organization.businessName || sale.organization.name

  const subtotal = money(sale.subtotalAmount)
  const discount = money(sale.discountAmount)
  const tax = money(sale.taxAmount)
  const total = money(sale.totalAmount)

  const paid = money(sale.paidAmount)
  const balance = money(sale.balanceAmount)
  const payments = sale.payments ?? []
  const org = sale.organization
  const cust = sale.customer
  const billToAddress = cust.workAddress || cust.homeAddress || null

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl p-8 print:p-0">
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-start gap-4">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={`${orgName} logo`}
                className="h-24 w-24 rounded-2xl border border-slate-200 bg-white object-contain"
              />
            ) : null}
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">{orgName}</div>
              <h1 className="mt-1 text-2xl font-semibold">Invoice</h1>

              <div className="mt-2 text-sm text-slate-700">
                Invoice #: <span className="font-semibold">{invoiceNumber}</span>
              </div>
              <div className="text-sm text-slate-700">
                Date: <span className="font-semibold">{sale.createdAt.toLocaleDateString()}</span>
              </div>

              <div className="mt-3 text-sm text-slate-700">
                Bill to: <span className="font-semibold">{cust.fullName}</span>
                {cust.email ? <span className="text-slate-500"> • {cust.email}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 print:hidden">
            <SendInvoiceModal saleId={sale.id} defaultTo={sale.customer.email || ""} />
            <PrintButton />
          </div>
        </div>

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

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Job / Description</div>
            <div className="mt-1 text-sm font-semibold">{sale.description}</div>

            {sale.poNumber ? (
              <div className="mt-2 text-sm text-slate-700">
                PO: <span className="font-semibold">{sale.poNumber}</span>
              </div>
            ) : null}

            {sale.serviceAddress ? (
              <div className="mt-1 text-sm text-slate-700">
                Service Address: <span className="font-semibold">{sale.serviceAddress}</span>
              </div>
            ) : null}

            {sale.notes ? <div className="mt-2 text-sm text-slate-600">Notes: {sale.notes}</div> : null}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Balance general</div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{fmtMoney(subtotal)}</span>
              </div>

              {discount > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="font-semibold">-{fmtMoney(discount)}</span>
                </div>
              ) : null}

              {tax > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span className="font-semibold">{fmtMoney(tax)}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{fmtMoney(total)}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span>Paid</span>
                <span className="font-semibold">{fmtMoney(paid)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Remaining</span>
                <span className="font-semibold">{fmtMoney(balance)}</span>
              </div>

              <div className="pt-2">
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold">
                  Status: {sale.status}
                </span>
              </div>
            </div>
          </div>
        </div>

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

        <div className="mt-8">
          <div className="text-sm font-semibold">Payments</div>
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            {payments.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No payments yet.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {payments.map((p: any) => (
                  <details key={p.id} className="group">
                    <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm hover:bg-slate-50">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{fmtMoney(p.amount)}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {p.method}
                        </span>
                        <span className="text-xs text-slate-500">
                          {p.paidAt.toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">Receipt →</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-slate-700">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-slate-600">Notes: {p.notes || "—"}</div>
                        <a
                          href={`/payments/${p.id}/receipt`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
                        >
                          View receipt
                        </a>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>

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
