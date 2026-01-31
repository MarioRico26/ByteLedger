import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const saleId = String(body.saleId || "").trim()
    const to = String(body.to || "").trim()

    if (!saleId) {
      return NextResponse.json({ error: "saleId is required" }, { status: 400 })
    }

    if (!to || !to.includes("@")) {
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

    const orgName = sale.organization.businessName || sale.organization.name

    const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id
      .slice(-6)
      .toUpperCase()}`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const invoiceUrl = `${baseUrl}/sales/${sale.id}/invoice`

    const total = Number(sale.totalAmount).toFixed(2)
    const balance = Number(sale.balanceAmount).toFixed(2)

    const from = process.env.EMAIL_FROM || "ByteLedger <onboarding@resend.dev>"

    await resend.emails.send({
      from,
      to,
      subject: `${orgName} Invoice ${invoiceNumber}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
          <h2 style="margin:0 0 10px;">${orgName} - Invoice</h2>

          <p style="margin:0 0 6px;"><b>Invoice #:</b> ${invoiceNumber}</p>
          <p style="margin:0 0 6px;"><b>Description:</b> ${sale.description}</p>
          <p style="margin:0 0 6px;"><b>Total:</b> $${total}</p>
          <p style="margin:0 0 14px;"><b>Balance:</b> $${balance}</p>

          <a href="${invoiceUrl}"
            style="display:inline-block;padding:12px 16px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-weight:600;">
            View Invoice
          </a>

          <p style="margin-top:18px;font-size:12px;color:#666">
            Sent via ByteLedger by Byte Networks.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Send invoice error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to send invoice" },
      { status: 500 }
    )
  }
}