import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params

    const estimate = await prisma.estimate.findFirst({
      where: { id, organizationId: DEFAULT_ORG_ID },
      include: {
        customer: true,
        items: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    if (estimate.saleId) return NextResponse.json({ error: "Estimate already converted" }, { status: 400 })

    const sale = await prisma.sale.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        customerId: estimate.customerId,
        description: estimate.title,
        status: "PENDING",
        notes: estimate.notes,
        subtotalAmount: estimate.subtotalAmount,
        taxRate: estimate.taxRate,
        taxAmount: estimate.taxAmount,
        discountAmount: estimate.discountAmount,
        totalAmount: estimate.totalAmount,
        items: {
          create: estimate.items.map((it) => ({
            name: it.name,
            type: it.type,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
            organization: { connect: { id: DEFAULT_ORG_ID } },
            ...(it.productId ? { product: { connect: { id: it.productId } } } : {}),
          })),
        },
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
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: "Failed to convert estimate" }, { status: 500 })
  }
}
