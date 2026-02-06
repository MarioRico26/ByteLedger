import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

export async function GET() {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const customers = await prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()

    const fullName = String(body.fullName || "").trim()
    if (!fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId: orgId,

        fullName,
        phone: body.phone ? String(body.phone).trim() : null,
        email: body.email ? String(body.email).trim() : null,

        homeAddress: body.homeAddress ? String(body.homeAddress).trim() : null,
        workAddress: body.workAddress ? String(body.workAddress).trim() : null,

        reference: body.reference ? String(body.reference).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
