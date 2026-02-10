import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, isStrongEnough } from "@/lib/password"
import { createSession, setSessionCookie } from "@/lib/auth"
import { isUserAccessAllowed } from "@/lib/auth"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getAccessBlockedMessage(user: {
  isEnabled?: boolean | null
  accessStartsAt?: Date | string | null
  accessEndsAt?: Date | string | null
}) {
  const supportEmail =
    process.env.SUPPORT_EMAIL || process.env.BYTENETWORKS_SUPPORT_EMAIL || "support@bytenetworks.net"

  if (user?.isEnabled === false) {
    return `This account is disabled. Please contact ByteNetworks support at ${supportEmail}.`
  }

  const now = new Date()
  const start = user?.accessStartsAt ? new Date(user.accessStartsAt) : null
  const end = user?.accessEndsAt ? new Date(user.accessEndsAt) : null

  if (start && !Number.isNaN(start.valueOf()) && now < start) {
    return `This account is not active yet. Please contact ByteNetworks support at ${supportEmail}.`
  }
  if (end && !Number.isNaN(end.valueOf()) && now > end) {
    return `This account has expired. Please contact ByteNetworks support at ${supportEmail}.`
  }

  return `Access is blocked. Please contact ByteNetworks support at ${supportEmail}.`
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
    if (!isUserAccessAllowed(user)) {
      return NextResponse.json(
        { error: getAccessBlockedMessage(user) },
        { status: 403 }
      )
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
