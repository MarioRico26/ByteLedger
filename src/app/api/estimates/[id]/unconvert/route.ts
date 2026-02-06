import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const est = await prisma.estimate.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true, saleId: true },
    })

    if (!est) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    if (!est.saleId) return NextResponse.json({ ok: true, unconverted: false, reason: "No saleId set" })

    const saleId = est.saleId

    await prisma.$transaction(async (tx: any) => {
      // 1) Primero desconectamos el estimate del sale (para no violar FK)
      await tx.estimate.update({
        where: { id: est.id },
        data: {
          saleId: null,
          status: "DRAFT",
        },
      })

      // 2) Borramos dependencias del sale (payments no tiene cascade en schema)
      await tx.payment.deleteMany({ where: { saleId } })
      await tx.saleItem.deleteMany({ where: { saleId } })

      // 3) Borramos el sale
      await tx.sale.delete({ where: { id: saleId } })
    })

    return NextResponse.json({ ok: true, unconverted: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to unconvert estimate" }, { status: 500 })
  }
}
