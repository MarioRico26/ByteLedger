import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireExpenseAccess } from "@/lib/auth"

type Ctx = { params: { id: string } | Promise<{ id: string }> }

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

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requireExpenseAccess()
    const params = await ctx.params
    const expenseId = String(params?.id || "").trim()
    if (!expenseId) {
      return NextResponse.json({ error: "Expense id is required" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, organizationId: session.orgId! },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    const data: Record<string, unknown> = {}

    if (body?.title !== undefined) {
      const title = String(body.title || "").trim()
      if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
      data.title = title
    }
    if (body?.vendor !== undefined) data.vendor = String(body.vendor || "").trim() || null
    if (body?.description !== undefined) {
      data.description = String(body.description || "").trim() || null
    }
    if (body?.reference !== undefined) data.reference = String(body.reference || "").trim() || null
    if (body?.notes !== undefined) data.notes = String(body.notes || "").trim() || null
    if (body?.amount !== undefined) data.amount = parseAmountValue(body.amount)
    if (body?.expenseDate !== undefined) {
      data.expenseDate = parseDateValue(body.expenseDate, "expense_date")
    }
    if (body?.dueDate !== undefined) {
      data.dueDate = parseDateValue(body.dueDate, "due_date")
    }
    if (body?.status !== undefined) {
      data.status = STATUS_VALUES.includes(body.status) ? body.status : "PAID"
    }
    if (body?.paymentMethod !== undefined) {
      data.paymentMethod = METHOD_VALUES.includes(body.paymentMethod) ? body.paymentMethod : "OTHER"
    }
    if (body?.categoryId !== undefined) {
      const categoryId = String(body.categoryId || "").trim()
      if (!categoryId) {
        return NextResponse.json({ error: "Category is required" }, { status: 400 })
      }
      const category = await prisma.expenseCategory.findFirst({
        where: { id: categoryId, organizationId: session.orgId! },
        select: { id: true },
      })
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
      data.categoryId = categoryId
    }

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data,
      include: {
        category: {
          select: { id: true, name: true, color: true, isActive: true },
        },
      },
    })

    return NextResponse.json(toExpenseDto(updated))
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
    console.error("Expenses PATCH error:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const session = await requireExpenseAccess()
    const params = await ctx.params
    const expenseId = String(params?.id || "").trim()
    if (!expenseId) {
      return NextResponse.json({ error: "Expense id is required" }, { status: 400 })
    }

    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, organizationId: session.orgId! },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    await prisma.expense.delete({ where: { id: expenseId } })
    return NextResponse.json({ success: true, id: expenseId })
  } catch (error: any) {
    if (
      error?.message === "UNAUTHORIZED" ||
      error?.message === "FORBIDDEN" ||
      error?.message === "PASSWORD_CHANGE_REQUIRED"
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    console.error("Expenses DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
