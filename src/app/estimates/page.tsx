// byteledger/src/app/estimates/page.tsx
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import EstimatesTableClient, { type EstimateRow } from "./ui/EstimatesTableClient"

function s(n: any) {
  if (n === null || n === undefined) return "0"
  return String(n)
}

export default async function EstimatesPage() {
  const estimates = await prisma.estimate.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { id: true, fullName: true, email: true, phone: true } },
      _count: { select: { items: true } },
    },
  })

  const rows: EstimateRow[] = estimates.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    saleId: e.saleId,
    totalAmount: s(e.totalAmount),
    subtotalAmount: s(e.subtotalAmount),
    taxRate: s(e.taxRate),
    taxAmount: s(e.taxAmount),
    discountAmount: s(e.discountAmount),
    itemsCount: e._count.items,
    customer: e.customer
      ? { id: e.customer.id, fullName: e.customer.fullName, email: e.customer.email, phone: e.customer.phone }
      : null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estimates</h1>
        <p className="mt-1 text-sm text-zinc-400">Filter, duplicate, edit, quote, and convert to invoices.</p>
      </div>

      <EstimatesTableClient initialEstimates={rows} />
    </div>
  )
}