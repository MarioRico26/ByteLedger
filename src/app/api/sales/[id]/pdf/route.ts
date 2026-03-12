import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"
import { renderInvoicePdfBuffer } from "@/lib/pdf/renderInvoicePdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Ctx = { params: { id: string } | Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const params = await ctx.params
    const saleId = String(params?.id || "").trim()
    if (!saleId) return NextResponse.json({ error: "Sale id is required" }, { status: 400 })

    const sale = await prisma.sale.findFirst({
      where: { id: saleId, organizationId: orgId },
      include: {
        organization: true,
        customer: true,
        items: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { paidAt: "asc" } },
      },
    })

    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 })

    const pdf = await renderInvoicePdfBuffer(sale as any)
    const filename = `invoice-${sale.id.slice(0, 8)}.pdf`

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to render PDF" }, { status: 500 })
  }
}
