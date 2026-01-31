// byteledger/src/app/api/estimates/route.ts
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import { EstimateStatus, ProductType } from "@prisma/client"

function asNumber(v: unknown, fallback = 0) {
  const n = typeof v === "string" && v.trim() === "" ? NaN : Number(v)
  return Number.isFinite(n) ? n : fallback
}

type IncomingItem = {
  productId?: string | null
  name: string
  type: ProductType
  quantity: number
  unitPrice: number
}

export async function GET() {
  const rows = await prisma.estimate.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { id: true, fullName: true, email: true, phone: true } },
      items: { select: { id: true } },
    },
  })

  // JSON-safe
  const safe = rows.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    saleId: e.saleId,
    customer: e.customer,
    itemsCount: e.items.length,
    subtotalAmount: Number(e.subtotalAmount),
    taxRate: Number(e.taxRate),
    taxAmount: Number(e.taxAmount),
    discountAmount: Number(e.discountAmount),
    totalAmount: Number(e.totalAmount),
  }))

  return NextResponse.json(safe)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const title = String(body.title || "Estimate").trim()
    const customerId = String(body.customerId || "").trim()
    const notes = body.notes === undefined ? null : (body.notes ?? null)

    const status = (body.status as EstimateStatus | undefined) ?? EstimateStatus.DRAFT

    const items: IncomingItem[] = Array.isArray(body.items) ? body.items : []
    if (!customerId) return NextResponse.json({ error: "customerId is required" }, { status: 400 })
    if (items.length === 0) return NextResponse.json({ error: "items are required" }, { status: 400 })

    // Subtotal
    const subtotal = items.reduce((acc, it) => {
      const qty = Math.max(asNumber(it.quantity, 0), 0)
      const unit = Math.max(asNumber(it.unitPrice, 0), 0)
      return acc + qty * unit
    }, 0)

    // Taxes & Discount (según tu schema: NO null)
    const taxRate = Math.max(asNumber(body.taxRate, 0), 0)
    const discountAmount = Math.max(asNumber(body.discountAmount, 0), 0)

    const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0
    const totalAmount = Math.max(subtotal + taxAmount - discountAmount, 0)

    const created = await prisma.estimate.create({
      data: {
        organization: { connect: { id: DEFAULT_ORG_ID } },
        customer: { connect: { id: customerId } },
        title,
        status,
        notes,

        subtotalAmount: subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        totalAmount,

        // IMPORTANT: no uses productId directo en create normal -> usa product connect
        items: {
          create: items.map((it) => ({
            organization: { connect: { id: DEFAULT_ORG_ID } },
            name: String(it.name || "").trim(),
            type: it.type,
            quantity: Math.max(asNumber(it.quantity, 0), 0),
            unitPrice: Math.max(asNumber(it.unitPrice, 0), 0),
            lineTotal: Math.max(asNumber(it.quantity, 0), 0) * Math.max(asNumber(it.unitPrice, 0), 0),
            ...(it.productId
              ? { product: { connect: { id: String(it.productId) } } }
              : {}),
          })),
        },
      },
      include: {
        customer: true,
        organization: true,
        items: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to create estimate" }, { status: 500 })
  }
}