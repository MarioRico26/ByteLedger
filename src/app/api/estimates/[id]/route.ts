// byteledger/src/app/api/estimates/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import type { ProductType } from "@prisma/client"

function asNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

type BodyItem = {
  productId: string | null
  name: string
  type: ProductType
  quantity: number
  unitPrice: number
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const estimate = await prisma.estimate.findFirst({
    where: { id: params.id, organizationId: DEFAULT_ORG_ID },
    include: {
      customer: true,
      organization: true,
      items: { orderBy: { createdAt: "asc" }, include: { product: true } },
    },
  })

  if (!estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
  return NextResponse.json({ estimate })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()

    const existing = await prisma.estimate.findFirst({
      where: { id: params.id, organizationId: DEFAULT_ORG_ID },
      select: { id: true, saleId: true, customerId: true },
    })
    if (!existing) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    if (existing.saleId) return NextResponse.json({ error: "Estimate already converted" }, { status: 400 })

    const items: BodyItem[] = Array.isArray(body.items) ? body.items : []

    const subtotal = items.reduce((sum, it) => sum + asNumber(it.quantity) * asNumber(it.unitPrice), 0)
    const taxRateNum = asNumber(body.taxRate, 0)
    const discountAmountNum = body.discountAmount === null || body.discountAmount === undefined || body.discountAmount === ""
      ? 0
      : asNumber(body.discountAmount, 0)

    const taxAmount = taxRateNum > 0 ? subtotal * (taxRateNum / 100) : 0
    const totalAmount = Math.max(subtotal + taxAmount - discountAmountNum, 0)

    const updated = await prisma.estimate.update({
      where: { id: params.id },
      data: {
        title: String(body.title ?? "Estimate"),
        notes: body.notes === undefined ? undefined : (body.notes ? String(body.notes) : null),

        subtotalAmount: subtotal,
        taxRate: taxRateNum,
        taxAmount,
        discountAmount: discountAmountNum,
        totalAmount,

        items: {
          deleteMany: {},
          create: items.map((it: BodyItem) => ({
            name: String(it.name ?? ""),
            type: it.type,
            quantity: asNumber(it.quantity, 1),
            unitPrice: asNumber(it.unitPrice, 0),
            lineTotal: asNumber(it.quantity, 1) * asNumber(it.unitPrice, 0),
            organization: { connect: { id: DEFAULT_ORG_ID } },
            ...(it.productId ? { product: { connect: { id: it.productId } } } : {}),
          })),
        },
      },
      include: {
        customer: true,
        organization: true,
        items: { orderBy: { createdAt: "asc" }, include: { product: true } },
      },
    })

    return NextResponse.json({ estimate: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 })
  }
}