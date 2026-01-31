import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const estimateId = String(body.estimateId || "").trim()

    if (!estimateId) {
      return NextResponse.json({ error: "estimateId is required" }, { status: 400 })
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    }

    if (estimate.organizationId !== DEFAULT_ORG_ID) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // ✅ If already converted
    if (estimate.saleId) {
      return NextResponse.json(
        { ok: true, saleId: estimate.saleId, message: "Estimate already approved." },
        { status: 200 }
      )
    }

    if (estimate.items.length === 0) {
      return NextResponse.json({ error: "Estimate has no items" }, { status: 400 })
    }

    // ✅ Create Sale from Estimate
    const sale = await prisma.sale.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        customerId: estimate.customerId,

        description: estimate.title,
        poNumber: estimate.poNumber,
        serviceAddress: estimate.serviceAddress,
        notes: estimate.notes,

        totalAmount: estimate.totalAmount,
        paidAmount: 0,
        balanceAmount: estimate.totalAmount,
        status: "PENDING",

        items: {
          create: estimate.items.map((i) => ({
            organization: { connect: { id: DEFAULT_ORG_ID } },

            name: i.name,
            type: i.type,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,

            ...(i.productId ? { product: { connect: { id: i.productId } } } : {}),
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    // ✅ Update estimate as APPROVED + link to sale
    await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        status: "APPROVED",
        saleId: sale.id,
      },
    })

    return NextResponse.json({ ok: true, saleId: sale.id, sale }, { status: 201 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message || "Failed to approve estimate" },
      { status: 500 }
    )
  }
}