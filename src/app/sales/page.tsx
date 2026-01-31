//byteledger/src/app/sales/page.tsx
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import NewSaleForm from "./ui/NewSaleForm"
import SaleCard from "./ui/SaleCard"

export default async function SalesPage() {
  const [customers, products, sales] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: DEFAULT_ORG_ID },
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true },
    }),

    prisma.product.findMany({
      where: { organizationId: DEFAULT_ORG_ID },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, price: true, active: true },
    }),

    prisma.sale.findMany({
      where: { organizationId: DEFAULT_ORG_ID },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  const productsClean = products
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      price: p.price ? p.price.toString() : null,
    }))

  const salesClean = sales.map((s) => ({
    id: s.id,
    description: s.description,
    status: s.status,
    totalAmount: s.totalAmount.toString(),
    paidAmount: s.paidAmount.toString(),
    balanceAmount: s.balanceAmount.toString(),
    createdAt: s.createdAt.toISOString(),
    customerName: s.customer.fullName,
    itemsCount: s.items.length,
    payments: (s.payments || []).map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      method: p.method,
      paidAt: p.paidAt.toISOString(),
      notes: p.notes ?? null,
    })),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track jobs, POs, service addresses, and payments.
          </p>
        </div>

        <NewSaleForm customers={customers} products={productsClean} />
      </div>

      <div className="space-y-3">
        {salesClean.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-500">
            No sales yet. Create your first job to start tracking.
          </div>
        ) : (
          salesClean.map((s) => <SaleCard key={s.id} sale={s} />)
        )}
      </div>
    </div>
  )
}