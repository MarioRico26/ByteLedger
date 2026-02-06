// src/lib/email/sendInvoiceEmail.ts
// MVP email para invoice (sale). Se usa tanto en /invoices/send como cuando un estimate ya está convertido.

import { Resend } from "resend"

type SendInvoiceEmailArgs = {
  sale: {
    id: string
    organizationId: string
    description: string | null
    totalAmount: any
    balanceAmount: any
    createdAt: Date
    organization: {
      businessName?: string | null
      name?: string | null
      email?: string | null
    }
    customer: {
      fullName: string
    } | null
  }
  to: string

  // opcional: adjuntos (PDF de la invoice, etc.)
  attachments?: { filename: string; content: Buffer }[]
}

function safe(v?: string | null) {
  return v?.trim() ? v.trim() : ""
}

function money(n: any) {
  const v = Number(n ?? 0)
  return Number.isFinite(v) ? v.toFixed(2) : "0.00"
}

export async function sendInvoiceEmail(args: SendInvoiceEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")

  const resend = new Resend(apiKey)

  const orgName = safe(args.sale.organization.businessName) || safe(args.sale.organization.name) || "Byte Networks"
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || "ByteLedger <onboarding@resend.dev>"
  const replyTo = safe(args.sale.organization.email) || undefined

  const invoiceNumber = `INV-${args.sale.createdAt.getFullYear()}-${args.sale.id.slice(-6).toUpperCase()}`

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const invoiceUrl = `${baseUrl}/sales/${args.sale.id}/invoice`

  const hasAttachments = Boolean(args.attachments?.length)

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
      <div style="max-width:640px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 10px;">${orgName} - Invoice</h2>
        <p style="margin:0 0 6px;"><b>Invoice #:</b> ${invoiceNumber}</p>
        ${args.sale.description ? `<p style="margin:0 0 6px;"><b>Description:</b> ${args.sale.description}</p>` : ""}
        <p style="margin:0 0 6px;"><b>Total:</b> $${money(args.sale.totalAmount)}</p>
        <p style="margin:0 0 14px;"><b>Balance:</b> $${money(args.sale.balanceAmount)}</p>

        <a href="${invoiceUrl}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-weight:600;">
          View Invoice
        </a>

        <p style="margin-top:12px;font-size:12px;color:#666">
          ${hasAttachments ? "Attachment: Invoice PDF included." : "Attachment missing (contact support)."}
        </p>

        <p style="margin-top:18px;font-size:12px;color:#666">Sent via ByteLedger.</p>
      </div>
    </div>
  `

  const attachments = (args.attachments || []).map((a: any) => ({
    filename: a.filename,
    content: a.content.toString("base64"),
  }))

  return resend.emails.send({
    from,
    to: args.to,
    subject: `${orgName} Invoice ${invoiceNumber}`,
    html,
    replyTo,
    ...(attachments.length ? { attachments } : {}),
  })
}

export type { SendInvoiceEmailArgs }
