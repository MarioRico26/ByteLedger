import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireExpenseAccess } from "@/lib/auth"

const STATUS_VALUES = ["PENDING", "PAID", "SCHEDULED"] as const
const METHOD_VALUES = ["ACH", "CARD", "CASH", "CHECK", "WIRE", "OTHER"] as const

function parseDateValue(value: unknown, field: string) {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`INVALID_${field.toUpperCase()}`)
  }
  return date
}

function parseAmountValue(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("INVALID_AMOUNT")
  }
  return amount
}

function toExpenseDto(expense: {
  id: string
  title: string
  vendor: string | null
  description: string | null
  reference: string | null
  notes: string | null
  amount: { toString(): string }
  expenseDate: Date
  dueDate: Date | null
  status: string
  paymentMethod: string
  createdByUserId: string | null
  createdByName: string | null
  createdAt: Date
  updatedAt: Date
  category:
    | {
        id: string
        name: string
        color: string | null
        isActive: boolean
      }
    | null
}) {
  return {
    id: expense.id,
    title: expense.title,
    vendor: expense.vendor,
    description: expense.description,
    reference: expense.reference,
    notes: expense.notes,
    amount: expense.amount.toString(),
    expenseDate: expense.expenseDate.toISOString(),
    dueDate: expense.dueDate ? expense.dueDate.toISOString() : null,
    status: expense.status,
    paymentMethod: expense.paymentMethod,
    createdByUserId: expense.createdByUserId,
    createdByName: expense.createdByName,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
    category: {
      id: expense.category?.id ?? "",
      name: expense.category?.name ?? "Uncategorized",
      color: expense.category?.color ?? "#2563eb",
      isActive: expense.category?.isActive ?? true,
    },
  }
}

export async function GET() {
  try {
    const session = await requireExpenseAccess()
    const expenses = await prisma.expense.findMany({
      where: { organizationId: session.orgId! },
      include: {
        category: {
          select: { id: true, name: true, color: true, isActive: true },
        },
      },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(expenses.map((expense) => toExpenseDto(expense)))
  } catch (error: any) {
    if (
      error?.message === "UNAUTHORIZED" ||
      error?.message === "FORBIDDEN" ||
      error?.message === "PASSWORD_CHANGE_REQUIRED"
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    console.error("Expenses GET error:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireExpenseAccess()
    const body = await req.json().catch(() => ({}))

    const title = String(body?.title || "").trim()
    const vendor = typeof body?.vendor === "string" ? body.vendor.trim() || null : null
    const description =
      typeof body?.description === "string" ? body.description.trim() || null : null
    const reference =
      typeof body?.reference === "string" ? body.reference.trim() || null : null
    const notes = typeof body?.notes === "string" ? body.notes.trim() || null : null
    const categoryId = String(body?.categoryId || "").trim()
    const status = STATUS_VALUES.includes(body?.status) ? body.status : "PAID"
    const paymentMethod = METHOD_VALUES.includes(body?.paymentMethod)
      ? body.paymentMethod
      : "OTHER"

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    const amount = parseAmountValue(body?.amount)
    const expenseDate = parseDateValue(body?.expenseDate, "expense_date") || new Date()
    const dueDate = parseDateValue(body?.dueDate, "due_date")

    const category = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, organizationId: session.orgId! },
      select: { id: true },
    })
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const created = await prisma.expense.create({
      data: {
        organizationId: session.orgId!,
        categoryId,
        title,
        vendor,
        description,
        reference,
        notes,
        amount,
        expenseDate,
        dueDate,
        status,
        paymentMethod,
        createdByUserId: session.user.id,
        createdByName: session.user.name || session.user.email,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, isActive: true },
        },
      },
    })

    return NextResponse.json(toExpenseDto(created), { status: 201 })
  } catch (error: any) {
    if (error?.message === "INVALID_AMOUNT") {
      return NextResponse.json({ error: "Amount must be a valid number" }, { status: 400 })
    }
    if (String(error?.message || "").startsWith("INVALID_")) {
      return NextResponse.json({ error: "Invalid date provided" }, { status: 400 })
    }
    if (
      error?.message === "UNAUTHORIZED" ||
      error?.message === "FORBIDDEN" ||
      error?.message === "PASSWORD_CHANGE_REQUIRED"
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    console.error("Expenses POST error:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
