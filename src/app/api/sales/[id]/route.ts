//byteledger/src/app/api/sales/[id]/route.ts:
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = String(params.id || "").trim()

    if (!saleId) {
      return NextResponse.json({ error: "Sale id is required" }, { status: 400 })
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        organizationId: DEFAULT_ORG_ID,
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