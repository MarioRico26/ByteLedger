import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { organizationId: DEFAULT_ORG_ID },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      products.map((p) => ({
        ...p,
        price: p.price ? p.price.toString() : null,
        createdAt: p.createdAt.toISOString(),
      }))
    )
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = String(body?.name || "").trim()
    const type = body?.type === "SERVICE" ? "SERVICE" : "PRODUCT"

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    // price nullable
    let price: number | null = null
    if (body?.price !== null && body?.price !== undefined && body?.price !== "") {
      const n = Number(body.price)
      price = Number.isFinite(n) ? n : null
    }

    const description =
      typeof body?.description === "string" ? body.description.trim() : null

    const created = await prisma.product.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        name,
        type,
        price,
        description: description || null,
        active: body?.active === false ? false : true,
      },
    })

    return NextResponse.json({
      ...created,
      price: created.price ? created.price.toString() : null,
      createdAt: created.createdAt.toISOString(),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}