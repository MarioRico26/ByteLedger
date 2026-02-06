import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"
import { sendInvoiceEmail } from "@/lib/email/sendInvoiceEmail"
import { renderInvoicePdfBuffer } from "@/lib/pdf/renderInvoicePdf"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  let saleId = ""
  let to = ""
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
        items: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { paidAt: "asc" } },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    if (sale.organizationId !== orgId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const pdfBuffer = await renderInvoicePdfBuffer(sale as any)
    const attachments = [{ filename: `invoice-${sale.id.slice(0, 8)}.pdf`, content: pdfBuffer }]

    await sendInvoiceEmail({ sale, to, attachments } as any)

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
          organizationId: sale?.organizationId || orgId,
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
