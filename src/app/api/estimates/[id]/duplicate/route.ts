// byteledger/src/app/api/estimates/[id]/duplicate/route.ts
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import crypto from "crypto"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const existing = await prisma.estimate.findFirst({
    where: { id: params.id, organizationId: DEFAULT_ORG_ID },
    include: { items: { orderBy: { createdAt: "asc" } } },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const created = await prisma.estimate.create({
    data: {
      organization: { connect: { id: DEFAULT_ORG_ID } },
      customer: { connect: { id: existing.customerId } },

      title: `Copy of ${existing.title}`,
      status: "DRAFT",
      notes: existing.notes,

      subtotalAmount: existing.subtotalAmount,
      taxRate: existing.taxRate,
      taxAmount: existing.taxAmount,
      discountAmount: existing.discountAmount,
      totalAmount: existing.totalAmount,

      publicToken: crypto.randomUUID(),

      items: {
        create: existing.items.map((it) => ({
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

  return NextResponse.json(created)
}