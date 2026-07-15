import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseDateOnlyToUTC(v: unknown): Date | null {
  const s = String(v ?? "").trim()
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!y || !mo || !d) return null
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))
}

type Ctx = { params: { id: string } | Promise<{ id: string }> }

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const params = await ctx.params
    const paymentId = String(params?.id || "").trim()
    if (!paymentId) return NextResponse.json({ error: "Payment id is required" }, { status: 400 })

    const existing = await prisma.payment.findFirst({
      where: { id: paymentId, organizationId: orgId },
      include: { sale: { include: { payments: true, customer: true } } },
    })
    if (!existing) return NextResponse.json({ error: "Payment not found" }, { status: 404 })

    const body = await req.json()
    const amount = toNumber(body.amount, toNumber(existing.amount, 0))
    const method = String(body.method || existing.method || "CASH").trim() || "CASH"
    const notes = body.notes === undefined ? existing.notes : (String(body.notes ?? "").trim() || null)
    const paidAt = body.paidAt ? parseDateOnlyToUTC(body.paidAt) ?? existing.paidAt : existing.paidAt

    if (amount <= 0) {
      return NextResponse.json({ error: "amount must be > 0" }, { status: 400 })
    }

    const otherPaid = (existing.sale.payments || []).reduce((sum: number, payment: any) => {
      if (payment.id === existing.id) return sum
      return sum + toNumber(payment.amount, 0)
    }, 0)

    const totalAmount = toNumber(existing.sale.totalAmount, 0)
    if (otherPaid + amount > totalAmount) {
      return NextResponse.json(
        { error: `Amount exceeds remaining balance (${Math.max(totalAmount - otherPaid, 0).toFixed(2)})` },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.update({
      where: { id: existing.id },
      data: { amount, method: method as any, notes, paidAt },
      include: {
        sale: {
          select: {
            id: true,
            description: true,
            createdAt: true,
            saleDate: true,
            customer: { select: { fullName: true, email: true } },
          },
        },
      },
    })

    const payments = await prisma.payment.findMany({
      where: { saleId: existing.saleId, organizationId: orgId },
    })

    const paidAmount = payments.reduce((sum: number, p: any) => sum + toNumber(p.amount, 0), 0)
    const balanceAmount = Math.max(totalAmount - paidAmount, 0)
    const newStatus = balanceAmount <= 0 ? "PAID" : existing.sale.dueDate && new Date(existing.sale.dueDate) < new Date() ? "OVERDUE" : "PENDING"

    await prisma.sale.update({
      where: { id: existing.saleId },
      data: { paidAmount, balanceAmount, status: newStatus as any },
    })

    return NextResponse.json(payment)
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || "Failed to update payment" }, { status: 500 })
  }
}
