import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import { sendInvoiceEmail } from "@/lib/email/sendInvoiceEmail"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  let saleId = ""
  let to = ""
  try {
    const body = await req.json()

    saleId = String(body.saleId || "").trim()
    to = String(body.to || "").trim()

    if (!saleId) {
      return NextResponse.json({ error: "saleId is required" }, { status: 400 })
    }

    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        organization: true,
        customer: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    if (sale.organizationId !== DEFAULT_ORG_ID) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    await sendInvoiceEmail({ sale, to } as any)

    await prisma.emailLog
      .create({
        data: {
          organizationId: sale.organizationId,
          saleId: sale.id,
          to,
          subject: "Invoice email",
          status: "SENT",
        },
      })
      .catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Send invoice error:", error)

    // Best-effort log (sin re-leer el body)
    try {
      if (saleId) {
        const sale = await prisma.sale.findUnique({ where: { id: saleId }, select: { organizationId: true } })
        await prisma.emailLog.create({
          data: {
            organizationId: sale?.organizationId || DEFAULT_ORG_ID,
            saleId,
            to: to || "(missing)",
            subject: "Invoice email",
            status: "FAILED",
            error: error?.message || "Failed to send invoice",
          },
        })
      }
    } catch {}

    return NextResponse.json(
      { error: error?.message || "Failed to send invoice" },
      { status: 500 }
    )
  }
}