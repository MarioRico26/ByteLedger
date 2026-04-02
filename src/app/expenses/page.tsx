import { prisma } from "@/lib/prisma"
import { canAccessExpenses, getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ExpensesClient, {
  type ExpenseCategoryRow,
  type ExpenseRow,
} from "./ui/ExpensesClient"

export default async function ExpensesPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.user.mustChangePassword) redirect("/set-password")
  if (!session.orgId || !canAccessExpenses(session)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Not authorized</div>
        <div className="mt-2 text-sm text-slate-500">
          This user does not have access to the expenses module.
        </div>
      </div>
    )
  }
  const orgId = session.orgId

  const [categories, expenses] = await Promise.all([
    prisma.expenseCategory.findMany({
      where: { organizationId: orgId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { expenses: true } } },
    }),
    prisma.expense.findMany({
      where: { organizationId: orgId },
      include: {
        category: {
          select: { id: true, name: true, color: true, isActive: true },
        },
      },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    }),
  ])

  const cleanCategories: ExpenseCategoryRow[] = categories.map((category: (typeof categories)[number]) => ({
    id: category.id,
    name: category.name,
    color: category.color ?? "#2563eb",
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    expensesCount: category._count.expenses,
  }))

  const cleanExpenses: ExpenseRow[] = expenses.map((expense: (typeof expenses)[number]) => ({
    id: expense.id,
    title: expense.title,
    vendor: expense.vendor ?? null,
    description: expense.description ?? null,
    reference: expense.reference ?? null,
    notes: expense.notes ?? null,
    amount: expense.amount.toString(),
    expenseDate: expense.expenseDate.toISOString(),
    dueDate: expense.dueDate ? expense.dueDate.toISOString() : null,
    status: expense.status,
    paymentMethod: expense.paymentMethod,
    createdByUserId: expense.createdByUserId ?? null,
    createdByName: expense.createdByName ?? null,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
    category: {
      id: expense.category?.id ?? "",
      name: expense.category?.name ?? "Uncategorized",
      color: expense.category?.color ?? "#2563eb",
      isActive: expense.category?.isActive ?? true,
    },
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Expenses</h1>
        <p className="page-subtitle">
          Track licenses, payroll, equipment, vendors, and operating spend.
        </p>
      </div>

      <ExpensesClient
        initialCategories={cleanCategories}
        initialExpenses={cleanExpenses}
      />
    </div>
  )
}
