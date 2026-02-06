import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrgIdOrNull } from "@/lib/auth"

function num(x: any) {
  const v = Number(x)
  return Number.isFinite(v) ? v : 0
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

export async function GET() {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sales = await prisma.sale.findMany({
      where: { organizationId: orgId },
      include: { customer: true, items: true, payments: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const orgId = await getOrgIdOrNull()
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()

    const customerId = String(body.customerId || "").trim()
    const description = String(body.description || "").trim()
    const poNumber = body.poNumber ? String(body.poNumber).trim() : null
    const serviceAddress = body.serviceAddress ? String(body.serviceAddress).trim() : null
    const notes = body.notes ? String(body.notes).trim() : null
    const dueDate = body.dueDate ? new Date(body.dueDate) : null

    const discountRaw =
      body.discountAmount !== undefined && body.discountAmount !== null
        ? body.discountAmount
        : body.discount ?? 0
    const discountAmount = Math.max(num(discountRaw), 0)
    const taxRate = clamp(num(body.taxRate), 0, 100)

    const items = Array.isArray(body.items) ? body.items : []

    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ error: "description is required" }, { status: 400 })
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    const normalizedItems = items.map((i: any) => {
      const quantity = Math.max(num(i.quantity), 1)
      const unitPrice = Math.max(num(i.unitPrice), 0)
      const lineTotal = quantity * unitPrice

      const type = i.type === "PRODUCT" ? "PRODUCT" : "SERVICE"
      const name = String(i.name || "").trim()

      if (!name) throw new Error("Each item must have a name")

      return {
        productId: i.productId ? String(i.productId) : null,
        name,
        type,
        quantity,
        unitPrice,
        lineTotal,
      }
    })

    const subtotal = normalizedItems.reduce((sum: number, i: any) => sum + num(i.lineTotal), 0)
    const taxableBase = Math.max(subtotal - discountAmount, 0)
    const taxAmount = taxableBase * (taxRate / 100)
    const totalAmount = Math.max(subtotal - discountAmount + taxAmount, 0)

    const sale = await prisma.sale.create({
      data: {
        organization: { connect: { id: orgId } },
        customer: { connect: { id: customerId } },
        description,
        poNumber,
        serviceAddress,
        notes,
        dueDate,

        subtotalAmount: subtotal,
        discountAmount,
        taxRate,
        taxAmount,
        totalAmount,

        paidAmount: 0,
        balanceAmount: totalAmount,

        items: {
          create: normalizedItems.map((i: any) => ({
            organization: { connect: { id: orgId } },
            productId: i.productId,
            name: i.name,
            type: i.type,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
          })),
        },
      },
      include: { customer: true, items: true, payments: true },
    })

    return NextResponse.json(sale)
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || "Failed to create sale" }, { status: 500 })
  }
}
