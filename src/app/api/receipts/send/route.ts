import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"
import { sendReceiptEmail } from "@/lib/email/sendReceiptEmail"
import { renderReceiptPdfBuffer } from "@/lib/pdf/renderReceiptPdf"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  let paymentId = ""
  let to = ""
  let orgId: string | null = null
  try {
    orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()

    paymentId = String(body.paymentId || "").trim()
    to = String(body.to || "").trim()

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 })
    }

    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        organization: true,
        sale: {
          include: {
            customer: true,
            organization: true,
            items: { orderBy: { createdAt: "asc" } },
            payments: { orderBy: { paidAt: "asc" } },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.organizationId !== orgId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const receiptPdf = await renderReceiptPdfBuffer({
      id: payment.id,
      paidAt: payment.paidAt,
      amount: payment.amount,
      method: payment.method,
      notes: payment.notes ?? null,
      organization: payment.organization,
      customer: payment.sale.customer,
      sale: {
        id: payment.sale.id,
        description: payment.sale.description,
        createdAt: payment.sale.createdAt,
        dueDate: payment.sale.dueDate,
        subtotalAmount: payment.sale.subtotalAmount,
        discountAmount: payment.sale.discountAmount,
        taxRate: payment.sale.taxRate,
        taxAmount: payment.sale.taxAmount,
        totalAmount: payment.sale.totalAmount,
        paidAmount: payment.sale.paidAmount,
        balanceAmount: payment.sale.balanceAmount,
        items: payment.sale.items,
        payments: payment.sale.payments,
      },
    } as any)

    await sendReceiptEmail({
      payment: {
        ...payment,
        customer: payment.sale.customer,
      } as any,
      to,
      attachments: [{ filename: `receipt-${payment.id.slice(0, 8)}.pdf`, content: receiptPdf }],
    } as any)

    await prisma.emailLog
      .create({
        data: {
          organizationId: payment.organizationId,
          saleId: payment.saleId,
          to,
          subject: "Receipt email",
          status: "SENT",
        },
      })
      .catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Send receipt error:", error)

    try {
      if (paymentId) {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          select: { organizationId: true, saleId: true },
        })
        await prisma.emailLog.create({
          data: {
            organizationId: payment?.organizationId || orgId || "",
            saleId: payment?.saleId ?? null,
            to: to || "(missing)",
            subject: "Receipt email",
            status: "FAILED",
            error: error?.message || "Failed to send receipt",
          },
        })
      }
    } catch {}

    return NextResponse.json(
      { error: error?.message || "Failed to send receipt" },
      { status: 500 }
    )
  }
}
