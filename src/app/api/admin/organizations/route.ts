import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    await requireSuperAdmin()
    const body = await req.json().catch(() => ({}))

    const name = String(body.name || "").trim()
    if (!name) return NextResponse.json({ error: "Organization name is required" }, { status: 400 })

    const clean = (v: any) => {
      const s = String(v ?? "").trim()
      return s ? s : null
    }

    const org = await prisma.organization.create({
      data: {
        name,
        businessName: clean(body.businessName),
        email: clean(body.email),
        phone: clean(body.phone),
        website: clean(body.website),
        addressLine1: clean(body.addressLine1),
        addressLine2: clean(body.addressLine2),
        city: clean(body.city),
        state: clean(body.state),
        zip: clean(body.zip),
        country: clean(body.country),
      },
    })

    return NextResponse.json(org, { status: 201 })
  } catch (error: any) {
    if (error?.message === "FORBIDDEN" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    console.error("Create org error:", error)
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
  }
}
