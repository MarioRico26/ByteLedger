// byteledger/src/lib/email/sendEstimateEmail.ts
import { Resend } from "resend"

type OrgProfile = {
  businessName?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
}

type EstimateEmailPayload = {
  to: string
  from: string
  subject: string
  quoteUrl: string
  estimateTitle: string
  customerName: string
  totalAmount: number
  notes?: string | null
  org?: OrgProfile | null
}

function safeLine(v?: string | null) {
  return v?.trim() ? v.trim() : ""
}

function formatMoney(n: number) {
  const v = Number(n)
  return Number.isFinite(v) ? v.toFixed(2) : "0.00"
}

export async function sendEstimateEmail(payload: EstimateEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY in environment variables")

  const resend = new Resend(apiKey)

  const orgName =
    safeLine(payload.org?.businessName) ||
    safeLine(payload.org?.name) ||
    "Byte Networks"

  const orgEmail = safeLine(payload.org?.email)
  const orgPhone = safeLine(payload.org?.phone)
  const orgWebsite = safeLine(payload.org?.website)

  const address1 = safeLine(payload.org?.addressLine1)
  const address2 = safeLine(payload.org?.addressLine2)
  const city = safeLine(payload.org?.city)
  const state = safeLine(payload.org?.state)
  const zip = safeLine(payload.org?.zip)
  const country = safeLine(payload.org?.country)

  const addressLines = [
    address1,
    address2,
    [city, state, zip].filter(Boolean).join(", ").replace(", ,", ", "),
    country,
  ].filter(Boolean)

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      
      <div style="border-bottom:1px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280">
          Quote
        </div>
        <div style="font-size:22px;font-weight:700;margin-top:6px">
          ${orgName}
        </div>
      </div>

      <div style="margin-bottom:18px">
        <div style="font-size:14px;color:#374151">
          Hi <strong>${payload.customerName}</strong>,
        </div>
        <div style="font-size:14px;color:#374151;margin-top:6px">
          Here is your estimate: <strong>${payload.estimateTitle}</strong>
        </div>
      </div>

      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:18px;background:#f9fafb">
        <div style="font-size:13px;color:#6b7280">Total</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px">$${formatMoney(
          payload.totalAmount
        )}</div>
        ${
          payload.notes
            ? `<div style="margin-top:10px;font-size:13px;color:#374151">
                 <strong>Notes:</strong> ${payload.notes}
               </div>`
            : ""
        }
      </div>

      <div style="margin-bottom:22px">
        <a href="${payload.quoteUrl}"
           style="display:inline-block;background:#111827;color:white;text-decoration:none;
                  padding:12px 16px;border-radius:10px;font-weight:600;font-size:14px">
          View Quote
        </a>
        <div style="font-size:12px;color:#6b7280;margin-top:10px">
          If the button doesn’t work, copy & paste this link:
          <div style="word-break:break-all;margin-top:4px">${payload.quoteUrl}</div>
        </div>
      </div>

      <div style="border-top:1px solid #e5e7eb;padding-top:16px;color:#6b7280;font-size:12px">
        <div style="font-weight:700;color:#374151">${orgName}</div>
        ${
          addressLines.length
            ? `<div style="margin-top:6px">${addressLines.join("<br/>")}</div>`
            : ""
        }
        ${
          orgPhone
            ? `<div style="margin-top:6px"><strong>Phone:</strong> ${orgPhone}</div>`
            : ""
        }
        ${
          orgEmail
            ? `<div style="margin-top:2px"><strong>Email:</strong> ${orgEmail}</div>`
            : ""
        }
        ${
          orgWebsite
            ? `<div style="margin-top:2px"><strong>Website:</strong> ${orgWebsite}</div>`
            : ""
        }

        <div style="margin-top:12px;color:#9ca3af">
          Powered by <strong>${orgName}</strong>
        </div>
      </div>
    </div>
  </div>
  `

  const result = await resend.emails.send({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    html,
  })

  return result
}