import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await ctx.params

    const estimate = await prisma.estimate.findFirst({
      where: { id, organizationId: orgId },
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    }

    // ✅ If already converted, treat as success (not an error)
    if (estimate.saleId) {
      return NextResponse.json({ saleId: estimate.saleId, alreadyConverted: true })
    }

    const itemsCreate: Prisma.SaleItemCreateWithoutSaleInput[] = estimate.items.map((it) => ({
      organization: { connect: { id: orgId } },
      name: it.name,
      type: it.type,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      ...(it.productId ? { product: { connect: { id: it.productId } } } : {}),
    }))

    const sale = await prisma.sale.create({
      data: {
        organizationId: orgId,
        customerId: estimate.customerId,
        description: estimate.title,
        status: "PENDING",
        notes: estimate.notes,
        poNumber: estimate.poNumber,
        serviceAddress: estimate.serviceAddress,

        subtotalAmount: estimate.subtotalAmount,
        discountAmount: estimate.discountAmount,
        taxRate: estimate.taxRate,
        taxAmount: estimate.taxAmount,
        totalAmount: estimate.totalAmount,

        items: { create: itemsCreate },
      },
      select: { id: true },
    })

    await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        sale: { connect: { id: sale.id } },
        status: "APPROVED",
      },
    })

    return NextResponse.json({ saleId: sale.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to convert estimate" }, { status: 500 })
  }
}
