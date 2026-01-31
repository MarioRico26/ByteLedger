//byteledger/src/app/api/organization/profile/route.ts"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

export async function GET() {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: DEFAULT_ORG_ID },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json(org)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const data = {
      businessName: body.businessName ? String(body.businessName).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      website: body.website ? String(body.website).trim() : null,

      addressLine1: body.addressLine1 ? String(body.addressLine1).trim() : null,
      addressLine2: body.addressLine2 ? String(body.addressLine2).trim() : null,
      city: body.city ? String(body.city).trim() : null,
      state: body.state ? String(body.state).trim() : null,
      zip: body.zip ? String(body.zip).trim() : null,
      country: body.country ? String(body.country).trim() : null,
    }

    const updated = await prisma.organization.update({
      where: { id: DEFAULT_ORG_ID },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}