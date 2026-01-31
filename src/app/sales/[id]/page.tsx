// byteledger/src/app/sales/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import PrintButton from "./invoice/PrintButton"
import SendInvoiceModal from "./SendInvoiceModal"

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: saleId } = await params

  if (!saleId) {
    return (
      <div className="p-6 text-sm text-zinc-400">
        Invoice not found.
        <br />
        <span className="text-xs text-zinc-500">Missing sale id param.</span>
      </div>
    )
  }

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
      <div className="p-6 text-sm text-zinc-400">
        Invoice not found.
        <br />
        <span className="text-xs text-zinc-500">Sale ID: {saleId}</span>
      </div>
    )
  }

  if (sale.organizationId !== DEFAULT_ORG_ID) {
    return (
      <div className="p-6 text-sm text-red-600">
        Not authorized for this invoice.
        <div className="mt-2 text-xs text-zinc-600">
          Sale org: {sale.organizationId} <br />
          App org: {DEFAULT_ORG_ID}
        </div>
      </div>
    )
  }

  const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id
    .slice(-6)
    .toUpperCase()}`

  // Si estos campos existen en tu modelo, perfecto. Si alguno no existe, ponlo en 0.
  const subtotal = Number((sale as any).subtotalAmount ?? 0)
  const discount = Number((sale as any).discountAmount ?? 0)
  const taxRate = Number((sale as any).taxRate ?? 0)
  const tax = Number((sale as any).taxAmount ?? 0)

  const total = Number(sale.totalAmount ?? 0)
  const paid = Number(sale.paidAmount ?? 0)
  const balance = Number(sale.balanceAmount ?? 0)

  const org = sale.organization
  const orgName = org.businessName || org.name

  const cust = sale.customer
  const billToAddress = cust.workAddress || cust.homeAddress || null

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-4xl p-8 print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              {orgName}
            </div>
            <h1 className="mt-1 text-2xl font-semibold">Invoice</h1>

            <div className="mt-2 text-sm text-zinc-700">
              Invoice #: <span className="font-semibold">{invoiceNumber}</span>
            </div>

            <div className="text-sm text-zinc-700">
              Date:{" "}
              <span className="font-semibold">
                {sale.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 print:hidden">
            {/* ✅ tu componente espera defaultTo */}
            <SendInvoiceModal
              saleId={sale.id}
              defaultTo={sale.customer.email || ""}
            />
            <PrintButton />
          </div>
        </div>

        {/* From / Bill To */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* From */}
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">From</div>
            <div className="mt-2 text-sm font-semibold">{orgName}</div>

            <div className="mt-2 space-y-1 text-sm text-zinc-700">
              {org.email ? <div>{org.email}</div> : null}
              {org.phone ? <div>{org.phone}</div> : null}
              {org.website ? <div>{org.website}</div> : null}
            </div>

            {/* Organization address sí existe en tu modelo */}
            {(org.addressLine1 ||
              org.addressLine2 ||
              org.city ||
              org.state ||
              org.zip ||
              org.country) && (
              <div className="mt-3 text-sm text-zinc-700">
                <div className="font-medium text-zinc-600">Address</div>
                <div className="mt-1">
                  {org.addressLine1 ? <div>{org.addressLine1}</div> : null}
                  {org.addressLine2 ? <div>{org.addressLine2}</div> : null}
                  <div>
                    {[org.city, org.state, org.zip].filter(Boolean).join(", ")}
                  </div>
                  {org.country ? <div>{org.country}</div> : null}
                </div>
              </div>
            )}
          </div>

          {/* Bill To */}
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">Bill To</div>
            <div className="mt-2 text-sm font-semibold">{cust.fullName}</div>

            <div className="mt-2 space-y-1 text-sm text-zinc-700">
              {cust.email ? <div>{cust.email}</div> : null}
              {cust.phone ? <div>{cust.phone}</div> : null}
              {billToAddress ? (
                <div className="pt-2">
                  <div className="text-xs font-medium text-zinc-600">Address</div>
                  <div className="mt-1 text-sm text-zinc-700 whitespace-pre-line">
                    {billToAddress}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Job + Summary */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">
              Job / Description
            </div>
            <div className="mt-1 text-sm font-semibold">{sale.description}</div>

            {sale.poNumber && (
              <div className="mt-2 text-sm text-zinc-700">
                PO: <span className="font-semibold">{sale.poNumber}</span>
              </div>
            )}

            {sale.serviceAddress && (
              <div className="mt-1 text-sm text-zinc-700">
                Service Address:{" "}
                <span className="font-semibold">{sale.serviceAddress}</span>
              </div>
            )}

            {sale.notes && (
              <div className="mt-2 text-sm text-zinc-600">
                Notes: {sale.notes}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">Summary</div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Discount</span>
              <span className="font-semibold">-${discount.toFixed(2)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Tax ({taxRate.toFixed(3)}%)</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 text-sm">
              <span>Total</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Paid</span>
              <span className="font-semibold">${paid.toFixed(2)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Remaining</span>
              <span className="font-semibold">${balance.toFixed(2)}</span>
            </div>

            <div className="mt-3">
              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold">
                Status: {sale.status}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-8">
          <div className="text-sm font-semibold">Items</div>
          <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((i) => (
                  <tr key={i.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3 text-zinc-700">{i.type}</td>
                    <td className="px-4 py-3 text-right">{i.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      ${Number(i.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${Number(i.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
          <div className="font-semibold text-zinc-700">
            Thank you for your business.
          </div>
          <div className="mt-1">
            Powered by <span className="font-semibold">{orgName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}