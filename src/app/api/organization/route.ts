//byteledger/src/app/api/organization/route.ts:
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

export async function GET() {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: DEFAULT_ORG_ID },
    })

    return NextResponse.json(org)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const updated = await prisma.organization.update({
      where: { id: DEFAULT_ORG_ID },
      data: {
        businessName: body.businessName ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        website: body.website ?? null,

        addressLine1: body.addressLine1 ?? null,
        addressLine2: body.addressLine2 ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zip: body.zip ?? null,
        country: body.country ?? null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}