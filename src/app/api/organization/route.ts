//byteledger/src/app/api/organization/route.ts:
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

export async function GET() {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    })

    if (!org) {
      return NextResponse.json({
        name: "ByteLedger",
        businessName: null,
        phone: null,
        email: null,
        website: null,
        logoUrl: null,
        recurringFrequency: null,
        recurringDueDays: null,
        recurringReminderDays: null,
        defaultTaxRate: 0,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zip: null,
        country: null,
      })
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
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const clean = (v: any) => {
      const s = String(v ?? "").trim()
      return s ? s : null
    }

    const toNum = (v: any) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    }

    const data = {
      businessName: clean(body.businessName),
      phone: clean(body.phone),
      email: clean(body.email),
      website: clean(body.website),
      logoUrl: clean(body.logoUrl),
      recurringFrequency: clean(body.recurringFrequency),
      recurringDueDays: toNum(body.recurringDueDays),
      recurringReminderDays: clean(body.recurringReminderDays),
      defaultTaxRate: toNum(body.defaultTaxRate),
      addressLine1: clean(body.addressLine1),
      addressLine2: clean(body.addressLine2),
      city: clean(body.city),
      state: clean(body.state),
      zip: clean(body.zip),
      country: clean(body.country),
    }

    const updated = await prisma.organization.upsert({
      where: { id: orgId },
      create: {
        id: orgId,
        name: clean(body.name) || clean(body.businessName) || "ByteLedger",
        ...data,
      },
      update: data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}
