import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import EditEstimateForm from "./ui/EditEstimateForm"

export default async function EditEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const estimate = await prisma.estimate.findFirst({
    where: { id, organizationId: DEFAULT_ORG_ID },
    include: {
      customer: true,
      items: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!estimate) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-400">
        Estimate not found.
      </div>
    )
  }

  const customers = await prisma.customer.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, email: true, phone: true },
    take: 500,
  })

  const products = await prisma.product.findMany({
    where: { organizationId: DEFAULT_ORG_ID, active: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, price: true, type: true },
    take: 1000,
  })

  return (
    <EditEstimateForm
      estimate={{
        id: estimate.id,
        title: estimate.title,
        customerId: estimate.customerId,
        notes: estimate.notes,
        taxRate: Number(estimate.taxRate || 0),
        discountAmount: Number(estimate.discountAmount || 0),
        items: estimate.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          type: it.type,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice || 0),
        })),
      }}
      customers={customers}
      products={products}
    />
  )
}
