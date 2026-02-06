import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import SaleEditClient from "./ui/SaleEditClient"

export default async function SaleEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: saleId } = await params
  const orgId = await requireOrgId()

  if (!saleId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
        <div className="font-semibold">Edit Invoice</div>
        <div className="mt-2 text-sm text-slate-500">Missing sale id param.</div>
      </div>
    )
  }

  const [sale, customers, products] = await Promise.all([
    prisma.sale.findFirst({
      where: { id: saleId, organizationId: orgId },
      include: {
        customer: true,
        items: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { paidAt: "asc" } },
      },
    }),
    prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true },
    }),
    prisma.product.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, price: true, active: true },
    }),
  ])

  if (!sale) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
        <div className="font-semibold">Edit Invoice</div>
        <div className="mt-2 text-sm text-slate-500">Invoice not found.</div>
      </div>
    )
  }

  const saleClean = {
    id: sale.id,
    customerId: sale.customerId,
    description: sale.description,
    poNumber: sale.poNumber ?? "",
    serviceAddress: sale.serviceAddress ?? "",
    notes: sale.notes ?? "",
    dueDate: sale.dueDate ? sale.dueDate.toISOString() : null,
    taxRate: sale.taxRate?.toString?.() ?? "0",
    discountAmount: sale.discountAmount?.toString?.() ?? "0",
    paidAmount: sale.paidAmount?.toString?.() ?? "0",
    balanceAmount: sale.balanceAmount?.toString?.() ?? "0",
    items: sale.items.map((it) => ({
      id: it.id,
      productId: it.productId ?? null,
      name: it.name,
      type: it.type,
      quantity: it.quantity,
      unitPrice: it.unitPrice?.toString?.() ?? "0",
    })),
    payments: sale.payments.map((p) => ({
      id: p.id,
      amount: p.amount?.toString?.() ?? "0",
    })),
  }

  const productsClean = products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    price: p.price ? p.price.toString() : null,
    active: p.active,
  }))

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Edit Invoice</h1>
          <div className="mt-1 text-sm text-slate-500">#{sale.id.slice(0, 8)}</div>
        </div>

        <Link
          href={`/sales/${sale.id}`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          View Invoice
        </Link>
      </div>

      <SaleEditClient sale={saleClean} customers={customers} products={productsClean} />
    </div>
  )
}
