"use client"

import { useMemo, useState } from "react"

export type ExpenseCategoryRow = {
  id: string
  name: string
  color: string
  isActive: boolean
  createdAt: string
  expensesCount: number
}

export type ExpenseRow = {
  id: string
  title: string
  vendor: string | null
  description: string | null
  reference: string | null
  notes: string | null
  amount: string
  expenseDate: string
  dueDate: string | null
  status: string
  paymentMethod: string
  createdByUserId: string | null
  createdByName: string | null
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    color: string
    isActive: boolean
  }
}

type Props = {
  initialCategories: ExpenseCategoryRow[]
  initialExpenses: ExpenseRow[]
}

type Notice = { kind: "success" | "error"; text: string } | null

type ExpenseFormState = {
  title: string
  vendor: string
  categoryId: string
  amount: string
  expenseDate: string
  dueDate: string
  status: string
  paymentMethod: string
  reference: string
  description: string
  notes: string
}

const STATUS_OPTIONS = ["PAID", "PENDING", "SCHEDULED"] as const
const METHOD_OPTIONS = ["ACH", "CARD", "CASH", "CHECK", "WIRE", "OTHER"] as const

function money(value: string | number) {
  const amount = Number(value || 0)
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function toDateInput(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return ""
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildEmptyForm(categoryId = ""): ExpenseFormState {
  return {
    title: "",
    vendor: "",
    categoryId,
    amount: "",
    expenseDate: toDateInput(new Date().toISOString()),
    dueDate: "",
    status: "PAID",
    paymentMethod: "ACH",
    reference: "",
    description: "",
    notes: "",
  }
}

function shortDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return "—"
  return date.toLocaleDateString()
}

export default function ExpensesClient({ initialCategories, initialExpenses }: Props) {
  const [categories, setCategories] = useState<ExpenseCategoryRow[]>(initialCategories)
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [notice, setNotice] = useState<Notice>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryColor, setCategoryColor] = useState("#2563eb")
  const [savingCategory, setSavingCategory] = useState(false)
  const [savingExpense, setSavingExpense] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ExpenseFormState>(
    buildEmptyForm(initialCategories[0]?.id ?? "")
  )

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase()
    const fromDate = from ? new Date(`${from}T00:00:00`) : null
    const toDate = to ? new Date(`${to}T23:59:59`) : null

    return expenses.filter((expense) => {
      if (statusFilter !== "ALL" && expense.status !== statusFilter) return false
      if (categoryFilter !== "ALL" && expense.category.id !== categoryFilter) return false

      const expenseDate = new Date(expense.expenseDate)
      if (fromDate && expenseDate < fromDate) return false
      if (toDate && expenseDate > toDate) return false

      if (!query) return true
      const haystack = [
        expense.title,
        expense.vendor ?? "",
        expense.reference ?? "",
        expense.description ?? "",
        expense.notes ?? "",
        expense.category.name,
        expense.paymentMethod,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [expenses, search, statusFilter, categoryFilter, from, to])

  const metrics = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const paid = filteredExpenses
      .filter((expense) => expense.status === "PAID")
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const pending = filteredExpenses
      .filter((expense) => expense.status !== "PAID")
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

    const now = new Date()
    const monthTotal = filteredExpenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.expenseDate)
      if (
        expenseDate.getFullYear() === now.getFullYear() &&
        expenseDate.getMonth() === now.getMonth()
      ) {
        return sum + Number(expense.amount || 0)
      }
      return sum
    }, 0)

    return {
      total,
      paid,
      pending,
      monthTotal,
    }
  }, [filteredExpenses])

  function resetForm(categoryId = categories[0]?.id ?? "") {
    setEditingId(null)
    setForm(buildEmptyForm(categoryId))
  }

  async function seedStarterCategories() {
    setSavingCategory(true)
    setNotice(null)
    try {
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedDefaults: true }),
      })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(data?.error || "Failed to create starter categories")
      const nextCategories = Array.isArray(data) ? (data as ExpenseCategoryRow[]) : []
      setCategories(nextCategories)
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || nextCategories[0]?.id || "",
      }))
      setNotice({ kind: "success", text: "Starter categories created." })
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || "Failed to create starter categories" })
    } finally {
      setSavingCategory(false)
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryName.trim()) return
    setSavingCategory(true)
    setNotice(null)
    try {
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName, color: categoryColor }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to create category")
      const created = data as ExpenseCategoryRow
      setCategories((prev) => {
        const next = [created, ...prev]
        next.sort((a, b) => a.name.localeCompare(b.name))
        return next
      })
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || created.id,
      }))
      setCategoryName("")
      setCategoryColor("#2563eb")
      setNotice({ kind: "success", text: "Category created." })
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || "Failed to create category" })
    } finally {
      setSavingCategory(false)
    }
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setNotice({ kind: "error", text: "Title is required." })
      return
    }
    if (!form.categoryId) {
      setNotice({ kind: "error", text: "Create/select a category first." })
      return
    }
    if (!form.amount.trim()) {
      setNotice({ kind: "error", text: "Amount is required." })
      return
    }

    setSavingExpense(true)
    setNotice(null)
    try {
      const payload = {
        title: form.title,
        vendor: form.vendor,
        categoryId: form.categoryId,
        amount: form.amount,
        expenseDate: form.expenseDate,
        dueDate: form.dueDate,
        status: form.status,
        paymentMethod: form.paymentMethod,
        reference: form.reference,
        description: form.description,
        notes: form.notes,
      }

      const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to save expense")

      const saved = data as ExpenseRow
      setExpenses((prev) => {
        const next = editingId
          ? prev.map((expense) => (expense.id === editingId ? saved : expense))
          : [saved, ...prev]
        next.sort((a, b) => {
          const byDate = new Date(b.expenseDate).valueOf() - new Date(a.expenseDate).valueOf()
          if (byDate !== 0) return byDate
          return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
        })
        return next
      })
      resetForm(form.categoryId)
      setNotice({ kind: "success", text: editingId ? "Expense updated." : "Expense created." })
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || "Failed to save expense" })
    } finally {
      setSavingExpense(false)
    }
  }

  function startEdit(expense: ExpenseRow) {
    setEditingId(expense.id)
    setForm({
      title: expense.title,
      vendor: expense.vendor ?? "",
      categoryId: expense.category.id,
      amount: expense.amount,
      expenseDate: toDateInput(expense.expenseDate),
      dueDate: toDateInput(expense.dueDate),
      status: expense.status,
      paymentMethod: expense.paymentMethod,
      reference: expense.reference ?? "",
      description: expense.description ?? "",
      notes: expense.notes ?? "",
    })
    setNotice(null)
  }

  async function removeExpense(expenseId: string) {
    const confirmed = confirm("Delete this expense?")
    if (!confirmed) return
    setDeletingId(expenseId)
    setNotice(null)
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to delete expense")
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId))
      if (editingId === expenseId) resetForm()
      setNotice({ kind: "success", text: "Expense deleted." })
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || "Failed to delete expense" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            notice.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="card card-stripe p-4">
          <div className="text-xs text-slate-500">Total spend</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{money(metrics.total)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Paid</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{money(metrics.paid)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Pending / scheduled</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{money(metrics.pending)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">This month</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{money(metrics.monthTotal)}</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <form onSubmit={submitExpense} className="card card-stripe p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {editingId ? "Edit expense" : "New expense"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Track operating costs, subscriptions, payroll, and vendor charges.
              </div>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={() => resetForm()}
                className="btn-secondary px-3 py-2 text-xs"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Title *</span>
              <input
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="Adobe licenses, payroll, router order..."
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Vendor / payee</span>
              <input
                value={form.vendor}
                onChange={(e) => setForm((current) => ({ ...current, vendor: e.target.value }))}
                placeholder="Microsoft, Verizon, payroll provider..."
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Category *</span>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))}
                className="rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Select category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Reference</span>
              <input
                value={form.reference}
                onChange={(e) => setForm((current) => ({ ...current, reference: e.target.value }))}
                placeholder="INV-00421 / March payroll / ACH..."
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Amount *</span>
              <input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
                placeholder="0.00"
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Payment method</span>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((current) => ({ ...current, paymentMethod: e.target.value }))
                }
                className="rounded-xl px-3 py-2 text-sm"
              >
                {METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Expense date</span>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm((current) => ({ ...current, expenseDate: e.target.value }))}
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))}
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
                className="rounded-xl px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({ ...current, description: e.target.value }))
                }
                placeholder="What exactly was purchased or billed?"
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Notes</span>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                placeholder="Optional internal notes, approvals, or payment context."
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => resetForm()} className="btn-secondary px-4 py-2 text-sm">
              Clear
            </button>
            <button
              type="submit"
              disabled={savingExpense}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {savingExpense ? "Saving..." : editingId ? "Save changes" : "Create expense"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="text-sm font-semibold text-slate-900">Expense categories</div>
            <div className="mt-1 text-xs text-slate-500">
              Use categories to separate payroll, licenses, equipment, utilities, and other spend.
            </div>

            {categories.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No categories yet. Create starter categories first so expenses can be classified.
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={seedStarterCategories}
                    disabled={savingCategory}
                    className="btn-accent px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {savingCategory ? "Creating..." : "Create starter categories"}
                  </button>
                </div>
              </div>
            ) : null}

            <form onSubmit={createCategory} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="grid gap-3">
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="rounded-xl px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-500">Color</label>
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="h-10 w-14 rounded-xl border border-slate-200 bg-white p-1"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingCategory || !categoryName.trim()}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
              >
                Add category
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{category.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {category.expensesCount.toLocaleString()} expense(s)
                      </div>
                    </div>
                  </div>
                  <span className="badge-strong border border-slate-200 bg-white text-slate-600">
                    {category.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <label className="grid gap-1 lg:col-span-2">
            <span className="text-xs text-slate-500">Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, vendor, reference, notes..."
              className="rounded-xl px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm"
            >
              <option value="ALL">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm"
            >
              <option value="ALL">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">From</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">To</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 min-w-[240px]">Expense</th>
                <th className="px-4 py-3 min-w-[170px]">Category</th>
                <th className="px-4 py-3 min-w-[180px]">Vendor / method</th>
                <th className="px-4 py-3 min-w-[150px]">Dates / status</th>
                <th className="px-4 py-3 text-right min-w-[120px]">Amount</th>
                <th className="px-4 py-3 text-right min-w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{expense.title}</div>
                      {expense.description ? (
                        <div className="mt-1 whitespace-pre-wrap text-xs text-slate-500">
                          {expense.description}
                        </div>
                      ) : null}
                      {expense.notes ? (
                        <div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          {expense.notes}
                        </div>
                      ) : null}
                      {expense.reference ? (
                        <div className="mt-2 text-[11px] text-slate-400">Ref: {expense.reference}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: expense.category.color }}
                        />
                        <span className="font-medium text-slate-800">{expense.category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>{expense.vendor || "—"}</div>
                      <div className="mt-1 text-xs text-slate-500">{expense.paymentMethod}</div>
                      {expense.createdByName ? (
                        <div className="mt-1 text-[11px] text-slate-400">By {expense.createdByName}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-700">Expense: {shortDate(expense.expenseDate)}</div>
                      <div className="mt-1 text-xs text-slate-500">Due: {shortDate(expense.dueDate)}</div>
                      <div className="mt-2">
                        <span
                          className={`badge-strong border ${
                            expense.status === "PAID"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : expense.status === "PENDING"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                          }`}
                        >
                          {expense.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">
                      {money(expense.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(expense)}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExpense(expense.id)}
                          disabled={deletingId === expense.id}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
                        >
                          {deletingId === expense.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
