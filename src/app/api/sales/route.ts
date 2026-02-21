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
    const descriptionRaw = String(body.description || "").trim()
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
    if (items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    const normalizedItems = items.map((i: any) => {
      const quantity = Math.max(num(i.quantity), 1)
      const unitPrice = Math.max(num(i.unitPrice), 0)
      const lineTotal = quantity * unitPrice

      const type = i.type === "PRODUCT" ? "PRODUCT" : "SERVICE"
      const taxable = typeof i.taxable === "boolean" ? i.taxable : type === "PRODUCT"
      const name = String(i.name || "").trim()

      if (!name) throw new Error("Each item must have a name")

      return {
        productId: i.productId ? String(i.productId) : null,
        name,
        type,
        taxable,
        quantity,
        unitPrice,
        lineTotal,
      }
    })

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId: orgId },
      select: { fullName: true },
    })
    const description =
      descriptionRaw ||
      (customer?.fullName
        ? `Invoice for ${customer.fullName}`
        : `Invoice (${normalizedItems.length} items)`)

    const subtotal = normalizedItems.reduce((sum: number, i: any) => sum + num(i.lineTotal), 0)
    const taxableSubtotal = normalizedItems.reduce(
      (sum: number, i: any) => sum + (i.taxable ? num(i.lineTotal) : 0),
      0
    )
    const appliedDiscount = Math.min(discountAmount, subtotal)
    const taxableDiscount = subtotal > 0 ? (appliedDiscount * taxableSubtotal) / subtotal : 0
    const taxableBase = Math.max(taxableSubtotal - taxableDiscount, 0)
    const taxAmount = taxableBase * (taxRate / 100)
    const totalAmount = Math.max(subtotal - appliedDiscount + taxAmount, 0)

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
        discountAmount: appliedDiscount,
        taxRate,
        taxAmount,
        totalAmount,

        paidAmount: 0,
        balanceAmount: totalAmount,

        items: {
          create: normalizedItems.map((i: any) => ({
            organization: { connect: { id: orgId } },
            ...(i.productId ? { product: { connect: { id: i.productId } } } : {}),
            name: i.name,
            type: i.type,
            taxable: i.taxable,
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
