import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createMagicLinkToken } from "@/lib/auth"
import { sendMagicLinkEmail } from "@/lib/email/sendMagicLinkEmail"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || "").trim().toLowerCase()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { organization: true } } },
    })

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: "This email is not associated with an organization." },
        { status: 404 }
      )
    }

    const { token } = await createMagicLinkToken(email)

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const link = `${baseUrl}/auth/verify?token=${token}`
    const orgName = user.memberships[0]?.organization?.businessName || user.memberships[0]?.organization?.name

    await sendMagicLinkEmail({ to: email, link, orgName })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Auth request error:", error)
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
