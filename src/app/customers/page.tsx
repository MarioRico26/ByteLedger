import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import CustomersClient from "./ui/CustomersClient"
import NewCustomerForm from "./ui/NewCustomerForm"

export default async function CustomersPage() {
  const orgId = await requireOrgId()
  const [customers, estimates, sales, payments] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.estimate.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, customerId: true, createdAt: true, totalAmount: true, status: true },
    }),
    prisma.sale.findMany({
      where: { organizationId: orgId },
      orderBy: { saleDate: "desc" },
      take: 200,
      select: { id: true, customerId: true, createdAt: true, saleDate: true, totalAmount: true, status: true, description: true },
    }),
    prisma.payment.findMany({
      where: { organizationId: orgId },
      orderBy: { paidAt: "desc" },
      take: 300,
      select: {
        id: true,
        amount: true,
        paidAt: true,
        method: true,
        sale: {
          select: {
            id: true,
            customerId: true,
            description: true,
          },
        },
      },
    }),
  ])

  const estimatesByCustomer = new Map<string, typeof estimates>()
  for (const e of estimates) {
    if (!e.customerId) continue
    const list = estimatesByCustomer.get(e.customerId) || []
    if (list.length < 2) {
      list.push(e)
      estimatesByCustomer.set(e.customerId, list)
    }
  }

  const salesByCustomer = new Map<string, typeof sales>()
  for (const s of sales) {
    if (!s.customerId) continue
    const list = salesByCustomer.get(s.customerId) || []
    if (list.length < 2) {
      list.push(s)
      salesByCustomer.set(s.customerId, list)
    }
  }

  const paymentsByCustomer = new Map<string, typeof payments>()
  for (const payment of payments) {
    const customerId = payment.sale?.customerId
    if (!customerId) continue
    const list = paymentsByCustomer.get(customerId) || []
    if (list.length < 4) {
      list.push(payment)
      paymentsByCustomer.set(customerId, list)
    }
  }

  const clean = customers.map((c: (typeof customers)[number]) => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    homeAddress: c.homeAddress,
    workAddress: c.workAddress,
    reference: c.reference,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    recentEstimates: (estimatesByCustomer.get(c.id) || []).map(
      (e: (typeof estimates)[number]) => ({
      id: e.id,
      createdAt: e.createdAt.toISOString(),
      totalAmount: e.totalAmount?.toString?.() ?? "0",
      status: e.status,
    })
    ),
    recentSales: (salesByCustomer.get(c.id) || []).map(
      (s: (typeof sales)[number]) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      saleDate: s.saleDate?.toISOString?.() ?? null,
      totalAmount: s.totalAmount?.toString?.() ?? "0",
      status: s.status,
      description: s.description ?? null,
    })
    ),
    recentPayments: (paymentsByCustomer.get(c.id) || []).map((payment: (typeof payments)[number]) => ({
      id: payment.id,
      amount: payment.amount?.toString?.() ?? "0",
      paidAt: payment.paidAt.toISOString(),
      method: payment.method,
      saleId: payment.sale?.id ?? null,
      saleDescription: payment.sale?.description ?? null,
    })),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">
            Contact info, addresses, and quick actions in one clean view.
          </p>
        </div>

        <NewCustomerForm />
      </div>

      <CustomersClient initialCustomers={clean} />
    </div>
  )
}
