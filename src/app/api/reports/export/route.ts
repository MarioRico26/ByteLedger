import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"

function toMoney(v: number) {
  if (!Number.isFinite(v)) return "0.00"
  return v.toFixed(2)
}

function parseDateInput(v?: string | null) {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function endOfDay(d: Date) {
  const end = new Date(d)
  end.setHours(23, 59, 59, 999)
  return end
}

export async function GET(req: Request) {
  try {
    const orgId = await requireOrgId()
    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") || "last30"

    const now = new Date()
    let start = new Date(now)
    let end = endOfDay(now)

    if (range === "thisMonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    } else if (range === "lastMonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
    } else if (range === "ytd") {
      start = new Date(now.getFullYear(), 0, 1)
    } else if (range === "custom") {
      const from = parseDateInput(searchParams.get("from"))
      const to = parseDateInput(searchParams.get("to"))
      if (from) start = from
      if (to) end = endOfDay(to)
    } else if (range === "last90") {
      start.setDate(now.getDate() - 90)
    } else if (range === "last7") {
      start.setDate(now.getDate() - 7)
    } else {
      start.setDate(now.getDate() - 30)
    }

    const [sales, payments, openSales] = await Promise.all([
      prisma.sale.findMany({
        where: { organizationId: orgId, saleDate: { gte: start, lte: end } },
        orderBy: { saleDate: "desc" },
        select: { id: true, saleDate: true, totalAmount: true, taxAmount: true },
      }),
      prisma.payment.findMany({
        where: { organizationId: orgId, paidAt: { gte: start, lte: end } },
        orderBy: { paidAt: "desc" },
        select: { id: true, paidAt: true, amount: true, method: true },
      }),
      prisma.sale.findMany({
        where: { organizationId: orgId, balanceAmount: { gt: 0 } },
        select: { id: true, dueDate: true, balanceAmount: true },
      }),
    ])

    const totalInvoiced = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)
    const totalTax = sales.reduce((sum, s) => sum + Number(s.taxAmount || 0), 0)
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const outstanding = openSales.reduce((sum, s) => sum + Number(s.balanceAmount || 0), 0)
    const avgInvoice = sales.length ? totalInvoiced / sales.length : 0

    const lines: string[] = []
    lines.push("Metric,Value")
    lines.push(`Invoiced,${toMoney(totalInvoiced)}`)
    lines.push(`Collected,${toMoney(totalPayments)}`)
    lines.push(`Outstanding,${toMoney(outstanding)}`)
    lines.push(`Tax Collected,${toMoney(totalTax)}`)
    lines.push(`Avg Invoice,${toMoney(avgInvoice)}`)
    lines.push("")

    lines.push("Sales (Invoices)")
    lines.push("Invoice ID,Date,Total,Tax")
    for (const s of sales) {
      const date = s.saleDate ? new Date(s.saleDate).toISOString().slice(0, 10) : ""
      lines.push(`${s.id},${date},${toMoney(Number(s.totalAmount || 0))},${toMoney(Number(s.taxAmount || 0))}`)
    }
    lines.push("")

    lines.push("Payments")
    lines.push("Payment ID,Date,Amount,Method")
    for (const p of payments) {
      const date = p.paidAt ? new Date(p.paidAt).toISOString().slice(0, 10) : ""
      lines.push(`${p.id},${date},${toMoney(Number(p.amount || 0))},${p.method}`)
    }

    const csv = lines.join("\n")
    const filename = `byteledger-report-${range}.csv`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || "Failed to export" }, { status: 500 })
  }
}
