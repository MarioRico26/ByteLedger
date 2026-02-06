import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, isStrongEnough } from "@/lib/password"
import { createSession, setSessionCookie } from "@/lib/auth"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }
    if (!isStrongEnough(password, 8)) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: true },
    })

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const session = await createSession(user.id)
    await setSessionCookie(session.id, session.expiresAt)

    return NextResponse.json({
      success: true,
      mustChangePassword: user.mustChangePassword,
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}
