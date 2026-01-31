//byteledger/src/app/api/payments/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import { PaymentMethod } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const saleId = String(body.saleId || "").trim()
    const amount = Number(body.amount || 0)
    const method: PaymentMethod = body.method || "CASH"
    const notes = body.notes ? String(body.notes).trim() : null
    const paidAt = body.paidAt ? new Date(body.paidAt) : new Date()

    if (!saleId) {
      return NextResponse.json({ error: "saleId is required" }, { status: 400 })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount must be > 0" }, { status: 400 })
    }

    // 1) Load sale
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, organizationId: DEFAULT_ORG_ID },
      include: { payments: true },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    // 2) Create payment
    await prisma.payment.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        saleId,
        amount,
        method,
        notes,
        paidAt,
      },
    })

    // 3) Recalculate totals
    const payments = await prisma.payment.findMany({
      where: { saleId, organizationId: DEFAULT_ORG_ID },
    })

    const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalAmount = Number(sale.totalAmount)
    const balanceAmount = Math.max(totalAmount - paidAmount, 0)

    const newStatus = balanceAmount <= 0 ? "PAID" : "PENDING"

    // 4) Update sale
    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        paidAmount,
        balanceAmount,
        status: newStatus,
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    return NextResponse.json(updatedSale, { status: 201 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message || "Failed to create payment" },
      { status: 500 }
    )
  }
}