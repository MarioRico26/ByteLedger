import { Resend } from "resend"

type SendMagicLinkArgs = {
  to: string
  link: string
  orgName?: string | null
}

function safe(v?: string | null) {
  return v?.trim() ? v.trim() : ""
}

export async function sendMagicLinkEmail({ to, link, orgName }: SendMagicLinkArgs) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || "ByteLedger <onboarding@resend.dev>"
  const brand = safe(orgName) || "ByteLedger"

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
      <div style="max-width:640px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 10px;">${brand} Login</h2>
        <p style="margin:0 0 12px;">Use the button below to sign in. This link expires in 15 minutes.</p>
        <a href="${link}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-weight:600;">
          Sign in to ${brand}
        </a>
        <p style="margin-top:18px;font-size:12px;color:#666">
          If you didn’t request this, you can ignore this email.
        </p>
      </div>
    </div>
  `

  return resend.emails.send({
    from,
    to,
    subject: `${brand} magic link`,
    html,
  })
}
