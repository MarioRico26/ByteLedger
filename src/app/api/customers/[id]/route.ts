import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const body = await req.json()

    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
    if (existing.organizationId !== DEFAULT_ORG_ID) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const fullName = String(body.fullName || "").trim()
    if (!fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 })
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        fullName,
        phone: body.phone ? String(body.phone).trim() : null,
        email: body.email ? String(body.email).trim() : null,
        homeAddress: body.homeAddress ? String(body.homeAddress).trim() : null,
        workAddress: body.workAddress ? String(body.workAddress).trim() : null,
        reference: body.reference ? String(body.reference).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params

    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
    if (existing.organizationId !== DEFAULT_ORG_ID) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Si quieres “soft delete” después, lo cambiamos. Por ahora borrado real.
    await prisma.customer.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error(error)
    // Prisma: si tiene FK (sales/estimates) va a fallar. Mensaje más humano:
    return NextResponse.json(
      { error: "Cannot delete customer with existing sales/estimates." },
      { status: 400 }
    )
  }
}