import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth"
import crypto from "crypto"
import { hashPassword } from "@/lib/password"
import { sendUserWelcomeEmail } from "@/lib/email/sendUserWelcomeEmail"
import { getBaseUrl } from "@/lib/appUrl"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function parseDateInput(v: unknown) {
  const s = String(v ?? "").trim()
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.valueOf())) return null
  return d
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin()
    const body = await req.json().catch(() => ({}))

    const ROLE_VALUES = ["OWNER", "ADMIN", "STAFF"] as const
    type Role = (typeof ROLE_VALUES)[number]

    const email = String(body.email || "").trim().toLowerCase()
    const name = String(body.name || "").trim() || null
    const organizationId = String(body.organizationId || "").trim()
    const role = ROLE_VALUES.includes(body.role) ? (body.role as Role) : "STAFF"
    const isEnabled = body.isEnabled === false ? false : true
    const accessStartsAt = parseDateInput(body.accessStartsAt)
    const accessEndsAt = parseDateInput(body.accessEndsAt)

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    const tempPassword = crypto
      .randomBytes(8)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 12)
    const passwordHash = hashPassword(tempPassword)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        isEnabled,
        accessStartsAt,
        accessEndsAt,
        passwordHash,
        mustChangePassword: true,
        memberships: {
          create: {
            organizationId,
            role,
          },
        },
      },
      include: { memberships: { include: { organization: true } } },
    })

    const baseUrl = getBaseUrl(req)

    let emailSent = true
    try {
      await sendUserWelcomeEmail({
        to: email,
        tempPassword,
        orgName: org.businessName || org.name,
        loginUrl: `${baseUrl}/login`,
      })
    } catch (err) {
      emailSent = false
      console.error("Welcome email failed:", err)
    }

    return NextResponse.json({ user, emailSent }, { status: 201 })
  } catch (error: any) {
    if (error?.message === "FORBIDDEN" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
