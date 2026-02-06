import { Resend } from "resend"

type SendUserWelcomeArgs = {
  to: string
  tempPassword: string
  orgName?: string | null
  loginUrl: string
}

function safe(v?: string | null) {
  return v?.trim() ? v.trim() : ""
}

export async function sendUserWelcomeEmail({ to, tempPassword, orgName, loginUrl }: SendUserWelcomeArgs) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || "ByteLedger <onboarding@resend.dev>"
  const brand = safe(orgName) || "ByteLedger"

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
      <div style="max-width:680px;margin:0 auto;padding:28px">
        <div style="border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:16px">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280">Welcome</div>
          <div style="font-size:22px;font-weight:700;margin-top:6px">${brand} access</div>
        </div>

        <p style="margin:0 0 12px;font-size:14px;color:#374151">
          Your account has been created. Use the credentials below to sign in, then you will be prompted to set a new password.
        </p>

        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:18px;background:#f9fafb">
          <div style="font-size:13px;color:#6b7280">Login details</div>
          <div style="margin-top:6px;font-size:14px;color:#111"><strong>Username:</strong> ${to}</div>
          <div style="margin-top:4px;font-size:14px;color:#111"><strong>Temporary password:</strong> ${tempPassword}</div>
        </div>

        <a href="${loginUrl}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-weight:600;">
          Sign in to ${brand}
        </a>

        <p style="margin-top:18px;font-size:12px;color:#6b7280">
          For security, please change your password immediately after signing in.
        </p>
      </div>
    </div>
  `

  return resend.emails.send({
    from,
    to,
    subject: `${brand} account access`,
    html,
  })
}
