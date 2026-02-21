import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getOrgIdOrNull()
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const est = await prisma.estimate.findFirst({
    where: { id, organizationId: orgId },
    include: { items: true },
  })
  if (!est) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })

  type EstimateItem = (typeof est.items)[number]
  const itemsCreate = est.items.map((it: EstimateItem) => ({
    name: it.name,
    type: it.type,
    taxable: (it as any).taxable ?? it.type === "PRODUCT",
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    lineTotal: it.lineTotal,
    organization: { connect: { id: orgId } },
    ...(it.productId ? { product: { connect: { id: it.productId } } } : {}),
  }))

  const created = await prisma.estimate.create({
    data: {
      organization: { connect: { id: orgId } },
      customer: { connect: { id: est.customerId } },
      title: `${est.title} (Copy)`,
      status: "DRAFT",
      notes: est.notes,
      taxRate: est.taxRate,
      discountAmount: est.discountAmount,
      subtotalAmount: est.subtotalAmount,
      taxAmount: est.taxAmount,
      totalAmount: est.totalAmount,
      items: { create: itemsCreate },
    },
    select: { id: true },
  })

  return NextResponse.json({ id: created.id })
}
