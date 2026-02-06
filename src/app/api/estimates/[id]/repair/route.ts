import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const id = params.id

    const est = await prisma.estimate.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true, saleId: true, status: true },
    })

    if (!est) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })

    if (!est.saleId) {
      return NextResponse.json({ ok: true, repaired: false, reason: "No saleId set" })
    }

    const sale = await prisma.sale.findFirst({
      where: { id: est.saleId, organizationId: orgId },
      select: { id: true },
    })

    // ✅ Si la venta existe, NO “reparamos” nada.
    if (sale) {
      return NextResponse.json({
        ok: true,
        repaired: false,
        reason: "Sale exists; estimate is truly converted",
        saleId: sale.id,
      })
    }

    // ✅ Si saleId existe pero el sale NO existe, es data corrupta: limpiamos.
    await prisma.estimate.update({
      where: { id: est.id },
      data: {
        saleId: null,
        status: "DRAFT",
      },
    })

    return NextResponse.json({ ok: true, repaired: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to repair estimate" }, { status: 500 })
  }
}
