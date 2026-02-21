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
  // Prisma Decimal u objeto con toString()
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

// Acepta "YYYY-MM-DD" y lo guarda como Date UTC (mediodía) para evitar líos de timezone
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
  taxable?: boolean
  quantity: number
  unitPrice: number
}

type Ctx = { params: Promise<{ id: string }> } // ✅ Next params puede venir como Promise

export async function GET(_: Request, ctx: Ctx) {
  const orgId = await getOrgIdOrNull()
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const estimateId = String(id || "").trim()

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, organizationId: orgId },
    include: {
      customer: true,
      organization: true,
      sale: { select: { id: true } },
      items: {
        orderBy: { createdAt: "asc" },
        include: { product: { select: { id: true, name: true } } },
      },
    },
  })

  if (!estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
  return NextResponse.json(estimate)
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await ctx.params
    const estimateId = String(id || "").trim()

    const existing = await prisma.estimate.findFirst({
      where: { id: estimateId, organizationId: orgId },
      select: { id: true, saleId: true, sale: { select: { id: true } } },
    })
    if (!existing) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })

    // ✅ Lock ONLY if the sale exists for real
    const hasRealSale = Boolean(existing.sale?.id)
    const hasOrphanSaleId = Boolean(existing.saleId && !existing.sale?.id)
    if (hasRealSale) {
      return NextResponse.json({ error: "Estimate is locked (already invoiced)" }, { status: 409 })
    }

    const body = await req.json()

    const title = String(body.title ?? "").trim() || "Untitled Estimate"
    const customerId = String(body.customerId ?? "").trim()
    if (!customerId) return NextResponse.json({ error: "customerId is required" }, { status: 400 })

    const notes = body.notes === undefined ? null : (body.notes ? String(body.notes) : null)
    const status = body.status ? String(body.status) : undefined

    // ✅ AQUÍ estaba el hueco: ahora sí guardamos PO y Valid Until
    const poNumber =
      body.poNumber === undefined ? undefined : (String(body.poNumber ?? "").trim() || null)

    const validUntil =
      body.validUntil === undefined ? undefined : parseDateOnlyToUTC(body.validUntil)

    const taxRateNum = clamp(asNumber(body.taxRate, 0), 0, 100)
    const discountAmountNum = Math.max(asNumber(body.discountAmount, 0), 0)

    const itemsIn: BodyItem[] = Array.isArray(body.items) ? body.items : []
    if (itemsIn.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    const normalizedItems = itemsIn.map((it: any) => {
      const qty = Math.max(1, Math.floor(asNumber(it.quantity, 1)))
      const unit = Math.max(0, asNumber(it.unitPrice, 0))
      const name = String(it.name ?? "").trim() || "Item"
      const t = String(it.type) === "SERVICE" ? "SERVICE" : "PRODUCT"
      const taxable = typeof it.taxable === "boolean" ? it.taxable : t === "PRODUCT"
      const productId = it.productId ? String(it.productId) : null
      return { productId, name, type: t, taxable, quantity: qty, unitPrice: unit, lineTotal: qty * unit }
    })

    const subtotal = normalizedItems.reduce((acc: number, it: any) => acc + it.lineTotal, 0)
    const taxableSubtotal = normalizedItems.reduce(
      (acc: number, it: any) => acc + (it.taxable ? it.lineTotal : 0),
      0
    )
    const appliedDiscount = Math.min(discountAmountNum, subtotal)
    const taxableDiscount = subtotal > 0 ? (appliedDiscount * taxableSubtotal) / subtotal : 0
    const taxableBase = Math.max(taxableSubtotal - taxableDiscount, 0)
    const taxAmount = taxRateNum > 0 ? taxableBase * (taxRateNum / 100) : 0
    const total = Math.max(subtotal - appliedDiscount + taxAmount, 0)

    const itemsCreate = normalizedItems.map((it: any) => ({
      name: it.name,
      type: it.type,
      taxable: it.taxable,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      organization: { connect: { id: orgId } },
      ...(it.productId ? { product: { connect: { id: it.productId } } } : {}),
    }))

    const updated = await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        title,
        customer: { connect: { id: customerId } },
        ...(status ? { status: status as any } : {}),
        notes,

        // ✅ GUARDAR PO y Valid Until (solo si vinieron en payload)
        ...(poNumber !== undefined ? { poNumber } : {}),
        ...(validUntil !== undefined ? { validUntil } : {}),

        // ✅ Instead of saleId: null (NOT allowed), disconnect via relation
        ...(hasOrphanSaleId ? { sale: { disconnect: true } } : {}),

        taxRate: taxRateNum,
        discountAmount: appliedDiscount,
        subtotalAmount: subtotal,
        taxAmount,
        totalAmount: total,

        items: { deleteMany: {}, create: itemsCreate as any },
      },
      include: {
        customer: true,
        organization: true,
        sale: { select: { id: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update estimate" }, { status: 500 })
  }
}
