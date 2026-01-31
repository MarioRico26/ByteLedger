// byteledger/src/app/payments/page.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

function money(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    orderBy: { paidAt: "desc" },
    take: 100,
    include: {
      sale: {
        select: {
          id: true,
          description: true,
          customer: { select: { fullName: true, email: true } },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Every payment with the sale + customer context.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-500">
          No payments yet.
          <div className="mt-2 text-xs text-zinc-600">
            Add a payment from <span className="text-zinc-300">Sales</span> to see them here.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const amt = money(p.amount)
            const paidAt = (() => {
              try {
                return new Date(p.paidAt).toLocaleDateString()
              } catch {
                return ""
              }
            })()

            const sale = p.sale
            const customerName = sale?.customer?.fullName || "Unknown customer"
            const saleDesc = sale?.description || "Unknown sale"

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: context */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-zinc-100">
                        ${amt.toFixed(2)}
                      </div>

                      <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[10px] text-zinc-300">
                        {p.method}
                      </span>

                      {paidAt ? (
                        <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[10px] text-zinc-500">
                          {paidAt}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 truncate text-sm text-zinc-300">
                      {saleDesc}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Customer:{" "}
                      <span className="text-zinc-300">{customerName}</span>
                      {sale?.customer?.email ? (
                        <>
                          {" "}
                          • <span className="text-zinc-400">{sale.customer.email}</span>
                        </>
                      ) : null}
                    </div>

                    {p.notes ? (
                      <div className="mt-2 text-xs text-zinc-500">
                        Notes: <span className="text-zinc-300">{p.notes}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Right: action */}
                  <div className="flex items-center gap-2 sm:justify-end">
                    {sale?.id ? (
                      <Link
                        href={`/sales/${sale.id}/invoice`}
                        target="_blank"
                        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
                      >
                        View Invoice
                      </Link>
                    ) : (
                      <span className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-2 text-xs text-zinc-500">
                        Missing sale link
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}