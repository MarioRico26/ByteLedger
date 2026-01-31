import { prisma } from "@/lib/prisma"

export default async function PublicEstimatePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { token?: string }
}) {
  const estimateId = String(params.id || "").trim()
  const token = String(searchParams?.token || "").trim()

  if (!estimateId || !token) {
    return (
      <div className="p-8 text-sm text-zinc-500">
        Estimate not found.
      </div>
    )
  }

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      customer: true,
      organization: true,
      items: true,
    },
  })

  if (!estimate || estimate.publicToken !== token) {
    return (
      <div className="p-8 text-sm text-zinc-500">
        Estimate not found.
      </div>
    )
  }

  const org = estimate.organization
  const orgName = org.businessName || org.name || "Byte Networks"

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-4xl p-8 print:p-0">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              {orgName}
            </div>
            <h1 className="mt-1 text-2xl font-semibold">Estimate</h1>

            <div className="mt-2 text-sm text-zinc-700">
              Title: <span className="font-semibold">{estimate.title}</span>
            </div>

            <div className="text-sm text-zinc-700">
              Date:{" "}
              <span className="font-semibold">
                {estimate.createdAt.toLocaleDateString()}
              </span>
            </div>

            <div className="mt-3 text-sm text-zinc-700">
              <div className="font-semibold">From</div>
              <div>{org.email || "info@bytenetworks.net"}</div>
              {org.phone && <div>{org.phone}</div>}
              {org.addressLine1 && (
                <div>
                  {org.addressLine1}
                  {org.addressLine2 ? `, ${org.addressLine2}` : ""}
                </div>
              )}
              {(org.city || org.state || org.zip) && (
                <div>
                  {[org.city, org.state, org.zip].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold">To</div>
            <div className="mt-1 text-sm text-zinc-700">
              {estimate.customer.fullName}
            </div>
            {estimate.customer.email && (
              <div className="text-sm text-zinc-700">
                {estimate.customer.email}
              </div>
            )}
            {estimate.customer.phone && (
              <div className="text-sm text-zinc-700">
                {estimate.customer.phone}
              </div>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">Description</div>
            <div className="mt-1 text-sm font-semibold">
              {estimate.description || "—"}
            </div>

            {estimate.poNumber && (
              <div className="mt-2 text-sm text-zinc-700">
                PO: <span className="font-semibold">{estimate.poNumber}</span>
              </div>
            )}

            {estimate.serviceAddress && (
              <div className="mt-1 text-sm text-zinc-700">
                Service Address:{" "}
                <span className="font-semibold">{estimate.serviceAddress}</span>
              </div>
            )}

            {estimate.notes && (
              <div className="mt-2 text-sm text-zinc-600">
                Notes: {estimate.notes}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-xs font-medium text-zinc-500">Summary</div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Total</span>
              <span className="font-semibold">
                ${Number(estimate.totalAmount).toFixed(2)}
              </span>
            </div>

            {estimate.validUntil && (
              <div className="mt-2 text-sm text-zinc-700">
                Valid until:{" "}
                <span className="font-semibold">
                  {estimate.validUntil.toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="mt-3">
              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold">
                Status: {estimate.status}
              </span>
            </div>
          </div>
        </div>

        {/* ITEMS */}
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
                {estimate.items.map((i) => (
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

        {/* FOOTER */}
        <div className="mt-10 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
          <div className="font-semibold text-zinc-700">
            Thank you for your business.
          </div>
          <div className="mt-1">
            Powered by <span className="font-semibold">Byte Networks</span>
          </div>

          <div className="mt-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}