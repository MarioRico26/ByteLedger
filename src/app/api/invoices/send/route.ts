// src/app/api/invoices/send/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import { getBaseUrl } from "@/lib/appUrl"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

function makeToken() {
  return crypto.randomBytes(24).toString("hex")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const saleId = String(body.saleId || "").trim()
    const to = String(body.to || "").trim()

    if (!saleId) {
      return NextResponse.json({ error: "saleId is required" }, { status: 400 })
    }
    if (!to) {
      return NextResponse.json({ error: "to is required" }, { status: 400 })
    }

    // Fetch sale + org + customer
    let sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { customer: true, organization: true },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    if (sale.organizationId !== DEFAULT_ORG_ID) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Ensure public token
    if (!sale.publicToken) {
      sale = await prisma.sale.update({
        where: { id: saleId },
        data: { publicToken: makeToken() },
        include: { customer: true, organization: true },
      })
    }

    const baseUrl = getBaseUrl(req)
    const invoiceUrl = `${baseUrl}/i/${sale.publicToken}`

    const orgName = sale.organization.businessName || sale.organization.name
    const customerName = sale.customer.fullName

    const from = process.env.RESEND_FROM || "ByteLedger <info@bytenetworks.net>"
    const subject = `Invoice: ${sale.description}`

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 6px 0;">${orgName}</h2>
        <p style="margin:0 0 14px 0;">Hi ${customerName}, here is your invoice:</p>

        <p style="margin:0 0 16px 0;">
          <a href="${invoiceUrl}" style="display:inline-block;background:#000;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600;">
            View Invoice
          </a>
        </p>

        <p style="margin:0;color:#666;font-size:12px;">
          If the button doesn’t work, copy this link:<br/>
          ${invoiceUrl}
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    return NextResponse.json({
      ok: true,
      id: result.data?.id || null,
      invoiceUrl,
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message || "Failed to send invoice" },
      { status: 500 }
    )
  }
}