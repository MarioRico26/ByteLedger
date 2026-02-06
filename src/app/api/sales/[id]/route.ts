//byteledger/src/app/api/sales/[id]/route.ts:
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function asNumber(v: unknown, fallback = 0) {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  if (v && typeof v === "object" && typeof (v as any).toString === "function") {
    const n = Number((v as any).toString())
    return Number.isFinite(n) ? n : fallback
  }
  const n = Number(v as any)
  return Number.isFinite(n) ? n : fallback
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
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

type BodyItem = {
  productId?: string | null
  name: string
  type: "PRODUCT" | "SERVICE"
  quantity: number
  unitPrice: number
}

type Ctx = { params: { id: string } | Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const params = await ctx.params
    const saleId = String(params?.id || "").trim()

    if (!saleId) {
      return NextResponse.json({ error: "Sale id is required" }, { status: 400 })
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        organizationId: orgId,
      },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch sale" }, { status: 500 })
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const params = await ctx.params
    const saleId = String(params?.id || "").trim()
    if (!saleId) return NextResponse.json({ error: "Sale id is required" }, { status: 400 })

    const existing = await prisma.sale.findFirst({
      where: { id: saleId, organizationId: orgId },
      include: { payments: true },
    })
    if (!existing) return NextResponse.json({ error: "Sale not found" }, { status: 404 })

    const body = await req.json()

    const customerId = String(body.customerId ?? "").trim()
    const description = String(body.description ?? "").trim()
    if (!customerId) return NextResponse.json({ error: "customerId is required" }, { status: 400 })
    if (!description) return NextResponse.json({ error: "description is required" }, { status: 400 })

    const poNumber = body.poNumber === undefined ? undefined : (String(body.poNumber ?? "").trim() || null)
    const serviceAddress =
      body.serviceAddress === undefined ? undefined : (String(body.serviceAddress ?? "").trim() || null)
    const notes = body.notes === undefined ? undefined : (String(body.notes ?? "").trim() || null)
    const dueDate = body.dueDate === undefined ? undefined : parseDateOnlyToUTC(body.dueDate)

    const discountRaw =
      body.discountAmount !== undefined && body.discountAmount !== null
        ? body.discountAmount
        : body.discount ?? 0
    const discountAmount = Math.max(asNumber(discountRaw, 0), 0)
    const taxRate = clamp(asNumber(body.taxRate, 0), 0, 100)

    const itemsIn: BodyItem[] = Array.isArray(body.items) ? body.items : []
    if (itemsIn.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    const normalizedItems = itemsIn.map((it) => {
      const qty = Math.max(1, Math.floor(asNumber(it.quantity, 1)))
      const unit = Math.max(0, asNumber(it.unitPrice, 0))
      const name = String(it.name ?? "").trim() || "Item"
      const t = String(it.type) === "SERVICE" ? "SERVICE" : "PRODUCT"
      const productId = it.productId ? String(it.productId) : null
      return { productId, name, type: t, quantity: qty, unitPrice: unit, lineTotal: qty * unit }
    })

    const subtotal = normalizedItems.reduce((acc, it) => acc + it.lineTotal, 0)
    const taxableBase = Math.max(subtotal - discountAmount, 0)
    const taxAmount = taxableBase * (taxRate / 100)
    const totalAmount = Math.max(subtotal - discountAmount + taxAmount, 0)

    const paidAmount = (existing.payments || []).reduce(
      (sum, p) => sum + asNumber(p.amount, 0),
      0
    )

    if (totalAmount < paidAmount) {
      return NextResponse.json(
        { error: "Total cannot be lower than amount already paid" },
        { status: 400 }
      )
    }

    const balanceAmount = Math.max(totalAmount - paidAmount, 0)

    let status: any = "PENDING"
    if (balanceAmount <= 0) status = "PAID"
    else if (dueDate && new Date(dueDate) < new Date()) status = "OVERDUE"

    const itemsCreate = normalizedItems.map((it) => ({
      name: it.name,
      type: it.type,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      organization: { connect: { id: orgId } },
      ...(it.productId ? { product: { connect: { id: it.productId } } } : {}),
    }))

    const updated = await prisma.sale.update({
      where: { id: saleId },
      data: {
        customer: { connect: { id: customerId } },
        description,
        ...(poNumber !== undefined ? { poNumber } : {}),
        ...(serviceAddress !== undefined ? { serviceAddress } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        taxRate,
        discountAmount,
        subtotalAmount: subtotal,
        taxAmount,
        totalAmount,
        paidAmount,
        balanceAmount,
        status,
        items: { deleteMany: {}, create: itemsCreate as any },
      },
      include: {
        customer: true,
        items: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { paidAt: "asc" } },
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update sale" }, { status: 500 })
  }
}
