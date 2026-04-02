import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireExpenseAccess } from "@/lib/auth"

const STARTER_CATEGORIES = [
  { name: "Licenses", color: "#2563eb" },
  { name: "Equipment", color: "#f59e0b" },
  { name: "Payroll", color: "#f97316" },
  { name: "Internet / Phone", color: "#0f766e" },
  { name: "Travel", color: "#7c3aed" },
  { name: "Marketing", color: "#dc2626" },
  { name: "Rent", color: "#475569" },
  { name: "Utilities", color: "#0891b2" },
  { name: "Miscellaneous", color: "#64748b" },
]

function toCategoryDto(category: {
  id: string
  name: string
  color: string | null
  isActive: boolean
  createdAt: Date
  _count?: { expenses?: number }
}) {
  return {
    id: category.id,
    name: category.name,
    color: category.color ?? "#2563eb",
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    expensesCount: category._count?.expenses ?? 0,
  }
}

export async function GET() {
  try {
    const session = await requireExpenseAccess()
    const categories = await prisma.expenseCategory.findMany({
      where: { organizationId: session.orgId! },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { expenses: true } } },
    })

    return NextResponse.json(categories.map((category) => toCategoryDto(category)))
  } catch (error: any) {
    if (
      error?.message === "UNAUTHORIZED" ||
      error?.message === "FORBIDDEN" ||
      error?.message === "PASSWORD_CHANGE_REQUIRED"
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    console.error("Expense categories GET error:", error)
    return NextResponse.json({ error: "Failed to fetch expense categories" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireExpenseAccess()
    const body = await req.json().catch(() => ({}))

    if (body?.seedDefaults === true) {
      await prisma.expenseCategory.createMany({
        data: STARTER_CATEGORIES.map((category) => ({
          organizationId: session.orgId!,
          name: category.name,
          color: category.color,
          isActive: true,
        })),
        skipDuplicates: true,
      })

      const categories = await prisma.expenseCategory.findMany({
        where: { organizationId: session.orgId! },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        include: { _count: { select: { expenses: true } } },
      })
      return NextResponse.json(categories.map((category) => toCategoryDto(category)), { status: 201 })
    }

    const name = String(body?.name || "").trim()
    const color = typeof body?.color === "string" && body.color.trim() ? body.color.trim() : "#2563eb"

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const created = await prisma.expenseCategory.create({
      data: {
        organizationId: session.orgId!,
        name,
        color,
        isActive: body?.isActive === false ? false : true,
      },
      include: { _count: { select: { expenses: true } } },
    })

    return NextResponse.json(toCategoryDto(created), { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }
    if (
      error?.message === "UNAUTHORIZED" ||
      error?.message === "FORBIDDEN" ||
      error?.message === "PASSWORD_CHANGE_REQUIRED"
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    console.error("Expense categories POST error:", error)
    return NextResponse.json({ error: "Failed to save expense category" }, { status: 500 })
  }
}
