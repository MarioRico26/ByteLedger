import { Resend } from "resend"

type SendReceiptEmailArgs = {
  payment: {
    id: string
    amount: any
    method: string
    paidAt: Date
    notes: string | null
    sale: {
      id: string
      description: string | null
      totalAmount: any
      balanceAmount: any
      createdAt: Date
    }
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
  attachments?: { filename: string; content: Buffer }[]
}

function safe(v?: string | null) {
  return v?.trim() ? v.trim() : ""
}

function money(n: any) {
  const v = Number(n ?? 0)
  return Number.isFinite(v) ? v.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "$0.00"
}

export async function sendReceiptEmail(args: SendReceiptEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")

  const resend = new Resend(apiKey)

  const orgName =
    safe(args.payment.organization.businessName) ||
    safe(args.payment.organization.name) ||
    "Byte Networks"
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || "ByteLedger <onboarding@resend.dev>"
  const replyTo = safe(args.payment.organization.email) || undefined

  const receiptNumber = `RCP-${args.payment.paidAt.getFullYear()}-${args.payment.id.slice(-6).toUpperCase()}`
  const invoiceNumber = `INV-${args.payment.sale.createdAt.getFullYear()}-${args.payment.sale.id
    .slice(-6)
    .toUpperCase()}`

  const attachments = (args.attachments || []).map((a: any) => ({
    filename: a.filename,
    content: a.content.toString("base64"),
  }))

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
      <div style="max-width:640px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 10px;">${orgName} - Receipt</h2>
        <p style="margin:0 0 6px;"><b>Receipt #:</b> ${receiptNumber}</p>
        <p style="margin:0 0 6px;"><b>Invoice #:</b> ${invoiceNumber}</p>
        <p style="margin:0 0 6px;"><b>Amount:</b> ${money(args.payment.amount)}</p>
        <p style="margin:0 0 6px;"><b>Method:</b> ${args.payment.method}</p>
        ${args.payment.notes ? `<p style="margin:0 0 6px;"><b>Notes:</b> ${args.payment.notes}</p>` : ""}
        <p style="margin:0 0 12px;"><b>Balance:</b> ${money(args.payment.sale.balanceAmount)}</p>

        <p style="margin-top:18px;font-size:12px;color:#666">Attachment: Receipt PDF included.</p>
      </div>
    </div>
  `

  return resend.emails.send({
    from,
    to: args.to,
    subject: `${orgName} Receipt ${receiptNumber}`,
    html,
    replyTo,
    ...(attachments.length ? { attachments } : {}),
  })
}
