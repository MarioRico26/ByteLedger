// byteledger/src/app/payments/page.tsx
import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import PaymentsTableClient, { type PaymentRow } from "./ui/PaymentsTableClient"

export default async function PaymentsPage() {
  const orgId = await requireOrgId()
  const payments = await prisma.payment.findMany({
    where: { organizationId: orgId },
    orderBy: { paidAt: "desc" },
    take: 100,
    include: {
      sale: {
        select: {
          id: true,
          description: true,
          createdAt: true,
          customer: { select: { fullName: true, email: true } },
        },
      },
    },
  })

  const paymentsClean: PaymentRow[] = payments.map((p: (typeof payments)[number]) => ({
    id: p.id,
    amount: p.amount?.toString?.() ?? "0",
    method: p.method,
    paidAt: p.paidAt.toISOString(),
    notes: p.notes ?? null,
    saleId: p.sale?.id ?? null,
    saleDescription: p.sale?.description ?? null,
    saleCreatedAt: p.sale?.createdAt ? p.sale.createdAt.toISOString() : null,
    customerName: p.sale?.customer?.fullName ?? null,
    customerEmail: p.sale?.customer?.email ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every payment with sale and customer context.
        </p>
      </div>

      {paymentsClean.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          No payments yet.
          <div className="mt-2 text-xs text-slate-500">
            Add a payment from <span className="font-semibold text-slate-700">Sales</span> to see them here.
          </div>
        </div>
      ) : (
        <PaymentsTableClient initialPayments={paymentsClean} />
      )}
    </div>
  )
}
