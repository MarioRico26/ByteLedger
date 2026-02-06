//byteledger/src/app/sales/page.tsx
import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import NewSaleForm from "./ui/NewSaleForm"
import SalesTableClient, { type SaleRow } from "./ui/SalesTableClient"

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: { customerId?: string; new?: string }
}) {
  const orgId = await requireOrgId()
  const [customers, products, sales] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true },
    }),

    prisma.product.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, price: true, active: true },
    }),

    prisma.sale.findMany({
      where: { organizationId: orgId },
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
    .filter((p: (typeof products)[number]) => p.active)
    .map((p: (typeof products)[number]) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      price: p.price ? p.price.toString() : null,
    }))

  const salesClean: SaleRow[] = sales.map((s: any) => ({
    id: s.id,
    description: s.description,
    status: s.status,
    totalAmount: s.totalAmount.toString(),
    paidAmount: s.paidAmount.toString(),
    balanceAmount: s.balanceAmount.toString(),
    createdAt: s.createdAt.toISOString(),
    saleDate: s.saleDate?.toISOString() ?? null,
    dueDate: s.dueDate?.toISOString() ?? null,
    poNumber: s.poNumber ?? null,
    serviceAddress: s.serviceAddress ?? null,
    customerName: s.customer.fullName,
    customerEmail: s.customer.email ?? null,
    customerPhone: s.customer.phone ?? null,
    itemsCount: s.items.length,
    paymentsCount: s.payments.length,
    payments: (s.payments || []).map((p: any) => ({
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
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">
            Track jobs, POs, service addresses, and payments.
          </p>
        </div>

        <NewSaleForm
          customers={customers}
          products={productsClean}
          initialCustomerId={searchParams?.customerId}
          initialOpen={searchParams?.new === "1" || searchParams?.new === "true"}
        />
      </div>

      {salesClean.length === 0 ? (
        <div className="card card-stripe p-5 text-sm text-slate-500">
          No sales yet. Create your first job to start tracking.
        </div>
      ) : (
        <SalesTableClient initialSales={salesClean} />
      )}
    </div>
  )
}
