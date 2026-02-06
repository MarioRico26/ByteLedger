import { Resend } from "resend"

type SendEstimateEmailArgs = {
  estimate: any
  to: string
  note?: string
  attachments?: { filename: string; content: Buffer }[]
}

function safe(v?: string | null) {
  return v?.trim() ? v.trim() : ""
}

function money(n: any) {
  const v = Number(n ?? 0)
  return Number.isFinite(v) ? v.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "$0.00"
}

export async function sendEstimateEmail(args: SendEstimateEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")

  const resend = new Resend(apiKey)

  const org = args.estimate.organization
  const orgName = safe(org?.businessName) || safe(org?.name) || "Byte Networks"
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || "ByteLedger <onboarding@resend.dev>"
  const replyTo = safe(org?.email) || undefined

  const hasAttachments = Boolean(args.attachments?.length)

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="border-bottom:1px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280">Estimate</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px">${orgName}</div>
      </div>

      <p style="margin:0 0 10px;font-size:14px;color:#374151">
        Hi <strong>${args.estimate.customer?.fullName || "there"}</strong>,
      </p>

      <p style="margin:0 0 14px;font-size:14px;color:#374151">
        Please find your estimate attached as a PDF.
      </p>

      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:18px;background:#f9fafb">
        <div style="font-size:13px;color:#6b7280">Estimate</div>
        <div style="font-size:16px;font-weight:700;margin-top:4px">${safe(args.estimate.title) || "Untitled"}</div>
        <div style="margin-top:6px;font-size:13px;color:#374151"><strong>Total:</strong> ${money(args.estimate.totalAmount)}</div>
        ${args.note ? `<div style="margin-top:10px;font-size:13px;color:#374151"><strong>Notes:</strong> ${args.note}</div>` : ""}
      </div>

      <div style="font-size:12px;color:#6b7280">
        ${hasAttachments ? "Attachment: PDF included." : "Attachment missing (contact support)."}
      </div>

      <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:16px;color:#6b7280;font-size:12px">
        <div style="font-weight:700;color:#374151">${orgName}</div>
        ${safe(org?.phone) ? `<div style="margin-top:6px"><strong>Phone:</strong> ${safe(org.phone)}</div>` : ""}
        ${safe(org?.email) ? `<div style="margin-top:2px"><strong>Email:</strong> ${safe(org.email)}</div>` : ""}
      </div>
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
    subject: `${orgName} Estimate: ${safe(args.estimate.title) || "Estimate"}`,
    html,
    replyTo,
    ...(attachments.length ? { attachments } : {}),
  })
}