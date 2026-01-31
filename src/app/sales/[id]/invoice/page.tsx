import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import PrintButton from "./PrintButton"
import SendInvoiceModal from "../SendInvoiceModal"

function money(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: saleId } = await params

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
    return <div className="p-6 text-sm text-zinc-400">Invoice not found.</div>
  }

  if (sale.organizationId !== DEFAULT_ORG_ID) {
    return <div className="p-6 text-sm text-red-600">Not authorized.</div>
  }

  const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id.slice(-6).toUpperCase()}`
  const orgName = sale.organization.businessName || sale.organization.name

  const subtotal = money(sale.subtotalAmount)
  const discount = money(sale.discountAmount)
  const tax = money(sale.taxAmount)
  const total = money(sale.totalAmount)

  const paid = money(sale.paidAmount)
  const balance = money(sale.balanceAmount)

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-4xl p-8 print:p-0">
        <div className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">{orgName}</div>
            <h1 className="mt-1 text-2xl font-semibold">Invoice</h1>

            <div className="mt-2 text-sm text-zinc-700">
              Invoice #: <span className="font-semibold">{invoiceNumber}</span>
            </div>
            <div className="text-sm text-zinc-700">
              Date: <span className="font-semibold">{sale.createdAt.toLocaleDateString()}</span>
            </div>

            <div className="mt-3 text-sm text-zinc-700">
              Bill to: <span className="font-semibold">{sale.customer.fullName}</span>
              {sale.customer.email ? <span className="text-zinc-500"> • {sale.customer.email}</span> : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 print:hidden">
            <SendInvoiceModal saleId={sale.id} defaultTo={sale.customer.email || ""} />
            <PrintButton />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">Job / Description</div>
            <div className="mt-1 text-sm font-semibold">{sale.description}</div>

            {sale.poNumber ? (
              <div className="mt-2 text-sm text-zinc-700">
                PO: <span className="font-semibold">{sale.poNumber}</span>
              </div>
            ) : null}

            {sale.serviceAddress ? (
              <div className="mt-1 text-sm text-zinc-700">
                Service Address: <span className="font-semibold">{sale.serviceAddress}</span>
              </div>
            ) : null}

            {sale.notes ? (
              <div className="mt-2 text-sm text-zinc-600">Notes: {sale.notes}</div>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">Summary</div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="font-semibold">-${discount.toFixed(2)}</span>
                </div>
              ) : null}

              {tax > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-zinc-200 pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span>Paid</span>
                <span className="font-semibold">${paid.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Remaining</span>
                <span className="font-semibold">${balance.toFixed(2)}</span>
              </div>

              <div className="pt-2">
                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold">
                  Status: {sale.status}
                </span>
              </div>
            </div>
          </div>
        </div>

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
                    <td className="px-4 py-3 text-right">${Number(i.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold">${Number(i.lineTotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
          <div className="font-semibold text-zinc-700">Thank you for your business.</div>
          <div className="mt-1">
            Powered by <span className="font-semibold">{orgName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}