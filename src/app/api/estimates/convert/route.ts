// byteledger/src/app/api/estimates/convert/route.ts
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import { SaleStatus } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const estimateId = String(body.estimateId || "").trim()
    if (!estimateId) return NextResponse.json({ error: "estimateId is required" }, { status: 400 })

    const estimate = await prisma.estimate.findFirst({
      where: { id: estimateId, organizationId: DEFAULT_ORG_ID },
      include: { items: true, customer: true },
    })
    if (!estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })

    if (estimate.saleId) {
      return NextResponse.json({ error: "Estimate already converted" }, { status: 400 })
    }

    const sale = await prisma.sale.create({
      data: {
        organization: { connect: { id: DEFAULT_ORG_ID } },
        customer: { connect: { id: estimate.customerId } },
        description: estimate.title,
        status: SaleStatus.PENDING,
        subtotalAmount: estimate.subtotalAmount,
        taxRate: estimate.taxRate,
        taxAmount: estimate.taxAmount,
        discountAmount: estimate.discountAmount,
        totalAmount: estimate.totalAmount,

        items: {
          create: estimate.items.map((it) => ({
            organization: { connect: { id: DEFAULT_ORG_ID } },
            name: it.name,
            type: it.type,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
            productId: it.productId ?? null, // SaleItem sí tiene productId en tu schema
          })),
        },
      },
    })

    await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        saleId: sale.id,
        status: "APPROVED",
      },
    })

    return NextResponse.json({ ok: true, saleId: sale.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to convert estimate" }, { status: 500 })
  }
}