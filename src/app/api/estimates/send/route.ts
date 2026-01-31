import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import { getBaseUrl } from "@/lib/appUrl"
import { Resend } from "resend"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const resend = new Resend(process.env.RESEND_API_KEY)

function makeToken() {
  return crypto.randomBytes(24).toString("hex")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const estimateId = String(body.estimateId || "").trim()
    const to = String(body.to || "").trim()

    if (!estimateId) {
      return NextResponse.json({ error: "estimateId is required" }, { status: 400 })
    }
    if (!to) {
      return NextResponse.json({ error: "to is required" }, { status: 400 })
    }

    let estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { customer: true, organization: true },
    })

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    }

    if (estimate.organizationId !== DEFAULT_ORG_ID) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // ensure public token
    if (!estimate.publicToken) {
      estimate = await prisma.estimate.update({
        where: { id: estimateId },
        data: { publicToken: makeToken() },
        include: { customer: true, organization: true },
      })
    }

    const baseUrl = await getBaseUrl()
    const quoteUrl = `${baseUrl}/q/${estimate.publicToken}`

    const orgName = estimate.organization.businessName || estimate.organization.name
    const from = process.env.RESEND_FROM || "ByteLedger <info@bytenetworks.net>"
    const subject = `Quote: ${estimate.title}`

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px 0;">${orgName}</h2>
        <p style="margin:0 0 16px 0;">Here is your quote:</p>

        <p style="margin:0 0 16px 0;">
          <a href="${quoteUrl}" style="display:inline-block;background:#000;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600;">
            View Quote
          </a>
        </p>

        <p style="margin:0;color:#666;font-size:12px;">
          If the button doesn’t work, copy this link:<br/>
          ${quoteUrl}
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    return NextResponse.json({ ok: true, id: result.data?.id || null, quoteUrl })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message || "Failed to send estimate" },
      { status: 500 }
    )
  }
}