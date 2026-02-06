import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPasswordResetToken } from "@/lib/auth"
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordResetEmail"

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

    // Always return success to prevent account enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const { token } = await createPasswordResetToken(user.id)

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const link = `${baseUrl}/reset-password?token=${token}`
    const orgName = user.memberships[0]?.organization?.businessName || user.memberships[0]?.organization?.name

    await sendPasswordResetEmail({ to: email, link, orgName })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 })
  }
}
