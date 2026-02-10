import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (existing.organizationId !== orgId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : undefined

    const type =
      body.type === "PRODUCT" || body.type === "SERVICE" ? body.type : undefined

    const active =
      typeof body.active === "boolean" ? body.active : undefined

    // price nullable
    let price: number | null | undefined = undefined
    if (body.price === null || body.price === "") {
      price = null
    } else if (typeof body.price === "number") {
      price = Number.isFinite(body.price) ? body.price : undefined
    } else if (typeof body.price === "string") {
      const n = Number(body.price)
      price = Number.isFinite(n) ? n : undefined
    }

    const description =
      body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description.trim() || null
          : undefined
    const imageUrl =
      body.imageUrl === null
        ? null
        : typeof body.imageUrl === "string"
          ? body.imageUrl.trim() || null
          : undefined

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      },
    })

    return NextResponse.json({
      ...updated,
      price: updated.price ? updated.price.toString() : null,
      createdAt: updated.createdAt.toISOString(),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}
