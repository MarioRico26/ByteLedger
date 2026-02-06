import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"
import { EstimateStatus, Prisma } from "@prisma/client"

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

  const itemsCreate: Prisma.EstimateItemCreateWithoutEstimateInput[] = est.items.map((it) => ({
    name: it.name,
    type: it.type,
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
      status: EstimateStatus.DRAFT,
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
