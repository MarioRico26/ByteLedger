import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"
import { sendEstimateEmail } from "@/lib/email/sendEstimateEmail"
import { sendInvoiceEmail } from "@/lib/email/sendInvoiceEmail"
import { renderEstimatePdfBuffer } from "@/lib/pdf/renderEstimatePdf"
import { renderInvoicePdfBuffer } from "@/lib/pdf/renderInvoicePdf"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

type Ctx = { params: { id: string } | Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  let estimateId = ""
  let to = ""

  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const params = await ctx.params
    estimateId = String(params?.id || "").trim()
    if (!estimateId) return NextResponse.json({ error: "Missing estimate id in route params." }, { status: 400 })

    const body = await req.json().catch(() => ({} as any))
    to = String(body.to || "").trim()
    const note = String(body.note || "").trim()

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        organization: true,
        customer: true,
        items: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found." }, { status: 404 })
    }

    if (estimate.organizationId !== orgId) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 })
    }

    // hardening: qty>0, price>=0
    type EstimateItem = (typeof estimate.items)[number]
    const hasBadQty = estimate.items.some((it: EstimateItem) => Number(it.quantity) <= 0)
    const hasBadPrice = estimate.items.some((it: EstimateItem) => Number(it.unitPrice) < 0)
    if (hasBadQty || hasBadPrice) {
      await prisma.emailLog.create({
        data: {
          organizationId: estimate.organizationId,
          estimateId: estimate.id,
          to: to || estimate.customer?.email || "(missing)",
          subject: "Estimate email",
          status: "FAILED",
          error: `Validation failed: ${hasBadQty ? "qty>0 " : ""}${hasBadPrice ? "price>=0" : ""}`.trim(),
        },
      }).catch(() => {})
      return NextResponse.json(
        { error: "Validation failed. Ensure qty > 0 and price >= 0 for all items." },
        { status: 400 }
      )
    }

    // if no 'to' -> customer email
    if (!to) to = String(estimate.customer?.email || "").trim()
    if (!to || !isValidEmail(to)) {
      await prisma.emailLog.create({
        data: {
          organizationId: estimate.organizationId,
          estimateId: estimate.id,
          to: to || "(missing)",
          subject: "Estimate email",
          status: "FAILED",
          error: "Missing/invalid recipient email",
        },
      }).catch(() => {})
      return NextResponse.json({ error: "Valid recipient email is required." }, { status: 400 })
    }

    // ✅ PDF attachment ALWAYS (at least estimate quote pdf)
    const pdfBuffer = await renderEstimatePdfBuffer(estimate as any)
    const attachments = [{ filename: `estimate-${estimate.id.slice(0, 8)}.pdf`, content: pdfBuffer }]

    // ✅ If converted -> send invoice email (but attach something)
    // (MVP: attach the same PDF so the customer gets a file, not a link. Later: add real invoice PDF renderer.)
    if (estimate.saleId) {
      const sale = await prisma.sale.findUnique({
        where: { id: estimate.saleId },
        include: {
          organization: true,
          customer: true,
          items: { orderBy: { createdAt: "asc" } },
          payments: { orderBy: { paidAt: "asc" } },
        },
      })

      if (!sale) {
        await prisma.emailLog.create({
          data: {
            organizationId: estimate.organizationId,
            estimateId: estimate.id,
            saleId: estimate.saleId,
            to,
            subject: "Invoice email",
            status: "FAILED",
            error: "Sale not found for converted estimate",
          },
        }).catch(() => {})
        return NextResponse.json({ error: "Invoice not found for this estimate." }, { status: 404 })
      }

      const invoicePdf = await renderInvoicePdfBuffer(sale as any)
      await sendInvoiceEmail({
        sale: sale as any,
        to,
        attachments: [{ filename: `invoice-${sale.id.slice(0, 8)}.pdf`, content: invoicePdf }],
      } as any)

      await prisma.emailLog.create({
        data: {
          organizationId: sale.organizationId,
          saleId: sale.id,
          estimateId: estimate.id,
          to,
          subject: "Invoice email",
          status: "SENT",
        },
      }).catch(() => {})

      return NextResponse.json({ success: true, sent: "invoice", saleId: sale.id })
    }

    // normal estimate send with attachment
    await sendEstimateEmail({
      estimate: estimate as any,
      to,
      note: note || undefined,
      attachments,
    } as any)

    await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        lastSentAt: new Date(),
        lastSentTo: to,
        sentCount: { increment: 1 },
        status: estimate.status === "DRAFT" ? "SENT" : estimate.status,
      },
    })

    await prisma.emailLog.create({
      data: {
        organizationId: estimate.organizationId,
        estimateId: estimate.id,
        to,
        subject: "Estimate email",
        status: "SENT",
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, sent: "estimate" })
  } catch (error: any) {
    console.error("❌ Send error:", error)

    try {
      if (estimateId) {
        const est = await prisma.estimate.findUnique({ where: { id: estimateId }, select: { organizationId: true } })
        await prisma.emailLog.create({
          data: {
            organizationId: est?.organizationId || orgId,
            estimateId,
            to: to || "(missing)",
            subject: "Estimate email",
            status: "FAILED",
            error: error?.message || "Failed to send",
          },
        })
      }
    } catch {}

    return NextResponse.json({ error: error?.message || "Failed to send." }, { status: 500 })
  }
}
