import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { consumeMagicLinkToken, createSession, setSessionCookie } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = String(searchParams.get("token") || "").trim()

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=missing-token", req.url))
    }

    const email = await consumeMagicLinkToken(token)
    if (!email) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: true },
    })

    if (!user || user.memberships.length === 0) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url))
    }

    const session = await createSession(user.id)
    await setSessionCookie(session.id, session.expiresAt)

    return NextResponse.redirect(new URL("/sales", req.url))
  } catch (error) {
    console.error("Verify magic link error:", error)
    return NextResponse.redirect(new URL("/login?error=server", req.url))
  }
}
