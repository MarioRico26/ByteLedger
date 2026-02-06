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

export async function POST(req: Request) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()

    const title = String(body.title ?? "").trim() || "Untitled Estimate"
    const customerId = String(body.customerId ?? "").trim()
    if (!customerId) return NextResponse.json({ error: "customerId is required" }, { status: 400 })

    const notes = body.notes === undefined ? null : (body.notes ? String(body.notes) : null)

    const poNumber = String(body.poNumber ?? "").trim() || null
    const validUntil = parseDateOnlyToUTC(body.validUntil)

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
      const productId = it.productId ? String(it.productId) : null
      return { productId, name, type: t, quantity: qty, unitPrice: unit, lineTotal: qty * unit }
    })

    const subtotal = normalizedItems.reduce((acc: any, it: any) => acc + it.lineTotal, 0)
    const taxAmount = taxRateNum > 0 ? subtotal * (taxRateNum / 100) : 0
    const total = Math.max(subtotal + taxAmount - discountAmountNum, 0)

    const itemsCreate = normalizedItems.map((it: any) => ({
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
        customer: { connect: { id: customerId } },
        title,
        status: "DRAFT",
        notes,

        poNumber,
        validUntil,

        taxRate: taxRateNum,
        discountAmount: discountAmountNum,
        subtotalAmount: subtotal,
        taxAmount,
        totalAmount: total,

        items: { create: itemsCreate as any },
      },
      include: { customer: true, organization: true, items: { orderBy: { createdAt: "asc" } } },
    })

    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create estimate" }, { status: 500 })
  }
}
