// src/app/i/[token]/page.tsx
import { prisma } from "@/lib/prisma"
import PrintButton from "@/app/sales/[id]/invoice/PrintButton"

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!token) {
    return (
      <div className="min-h-screen bg-white p-8 text-sm text-zinc-600">
        Invoice not found.
      </div>
    )
  }

  const sale = await prisma.sale.findUnique({
    where: { publicToken: token },
    include: {
      customer: true,
      items: true,
      payments: { orderBy: { paidAt: "desc" } },
      organization: true,
    },
  })

  if (!sale) {
    return (
      <div className="min-h-screen bg-white p-8 text-sm text-zinc-600">
        Invoice not found.
      </div>
    )
  }

  const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id
    .slice(-6)
    .toUpperCase()}`

  const total = Number(sale.totalAmount)
  const paid = Number(sale.paidAmount)
  const balance = Number(sale.balanceAmount)

  const orgName = sale.organization.businessName || sale.organization.name

  // Org profile fields (optional)
  const orgEmail = sale.organization.email
  const orgPhone = sale.organization.phone
  const orgAddr1 = sale.organization.addressLine1
  const orgAddr2 = sale.organization.addressLine2
  const orgCity = sale.organization.city
  const orgState = sale.organization.state
  const orgZip = sale.organization.zip

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-4xl p-8 print:p-0">
        <div className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-6">
          <div className="flex items-start gap-4">
            {sale.organization.logoUrl ? (
              <img
                src={sale.organization.logoUrl}
                alt={`${orgName} logo`}
                className="h-24 w-24 rounded-2xl border border-zinc-200 bg-white object-contain"
              />
            ) : null}
            <div className="min-w-0">
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

              {/* ✅ Org contact */}
              <div className="mt-3 text-sm text-zinc-700">
                {orgAddr1 ? <div>{orgAddr1}</div> : null}
                {orgAddr2 ? <div>{orgAddr2}</div> : null}
                {orgCity || orgState || orgZip ? (
                  <div>
                    {[orgCity, orgState, orgZip].filter(Boolean).join(", ")}
                  </div>
                ) : null}
                {orgPhone ? <div>Phone: {orgPhone}</div> : null}
                {orgEmail ? <div>Email: {orgEmail}</div> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 print:hidden">
            <PrintButton />
          </div>
        </div>

        {/* ✅ Bill To */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">Bill To</div>
            <div className="mt-1 text-sm font-semibold">{sale.customer.fullName}</div>
            {sale.customer.email ? (
              <div className="mt-1 text-sm text-zinc-700">{sale.customer.email}</div>
            ) : null}
            {sale.customer.phone ? (
              <div className="mt-1 text-sm text-zinc-700">{sale.customer.phone}</div>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">Summary</div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Total</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
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

        {/* Job info */}
        <div className="mt-6 rounded-xl border border-zinc-200 p-4">
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
                {sale.items.map((i: (typeof sale.items)[number]) => (
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
          <div className="font-semibold text-zinc-700">Thank you for your business.</div>
          <div className="mt-1">
            Powered by <span className="font-semibold">Byte Networks</span>
          </div>
        </div>
      </div>
    </div>
  )
}
