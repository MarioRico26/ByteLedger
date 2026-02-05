import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import { EstimateStatus, Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const id = params.id

  const est = await prisma.estimate.findFirst({
    where: { id, organizationId: DEFAULT_ORG_ID },
    include: { items: true },
  })
  if (!est) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })

  const itemsCreate: Prisma.EstimateItemCreateWithoutEstimateInput[] = est.items.map((it) => ({
    name: it.name,
    type: it.type,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    lineTotal: it.lineTotal,
    organization: { connect: { id: DEFAULT_ORG_ID } },
    ...(it.productId ? { product: { connect: { id: it.productId } } } : {}),
  }))

  const created = await prisma.estimate.create({
    data: {
      organization: { connect: { id: DEFAULT_ORG_ID } },
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