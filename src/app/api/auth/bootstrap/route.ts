import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, isStrongEnough } from "@/lib/password"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  try {
    const ROLE_OWNER = "OWNER" as const
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return NextResponse.json({ error: "Bootstrap already completed" }, { status: 409 })
    }

    const body = await req.json().catch(() => ({}))
    const email = String(body.email || "").trim().toLowerCase()
    const name = String(body.name || "").trim() || null
    const orgName = String(body.orgName || "").trim()
    const businessName = String(body.businessName || "").trim() || null
    const password = String(body.password || "")

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }
    if (!orgName) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 })
    }
    if (!isStrongEnough(password, 8)) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    let org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } })
    if (!org) {
      // Keep compatibility with existing seeded data
      const defaultOrgId = "org_demo_byteledger"
      org = await prisma.organization.create({
        data: {
          id: defaultOrgId,
          name: orgName,
          businessName,
        },
      })
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        isSuperAdmin: true,
        passwordHash: hashPassword(password),
        mustChangePassword: false,
        memberships: {
          create: {
            organizationId: org.id,
            role: ROLE_OWNER,
          },
        },
      },
    })

    return NextResponse.json({ success: true, userId: user.id, orgId: org.id })
  } catch (error: any) {
    console.error("Bootstrap error:", error)
    return NextResponse.json({ error: "Failed to bootstrap" }, { status: 500 })
  }
}
