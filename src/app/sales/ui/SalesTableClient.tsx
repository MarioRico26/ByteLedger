"use client"

import { Fragment, useMemo, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import AddPaymentModal from "./AddPaymentModal"

type SaleStatus = "PENDING" | "PAID" | "OVERDUE"

export type SaleRow = {
  id: string
  description: string
  status: SaleStatus
  totalAmount: string
  paidAmount: string
  balanceAmount: string
  createdAt: string
  saleDate: string | null
  dueDate: string | null
  poNumber: string | null
  serviceAddress: string | null
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  itemsCount: number
  paymentsCount: number
  payments?: {
    id: string
    amount: string
    method: string
    paidAt: string
    notes: string | null
  }[]
}

type Props = { initialSales: SaleRow[] }

function money(n: any) {
  const v = Number(n)
  if (!Number.isFinite(v)) return "$0.00"
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function fmtDate(iso?: string | null) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.valueOf())) return ""
    return d.toLocaleDateString()
  } catch {
    return ""
  }
}

function toNumber(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function calcBalance(totalAmount: string, paidAmount: string, balanceAmount: string) {
  const total = toNumber(totalAmount)
  const paid = toNumber(paidAmount)
  const stored = toNumber(balanceAmount)
  const computed = Math.max(total - paid, 0)
  if (stored === 0 && computed > 0) return computed
  return Math.max(stored, computed)
}

function dateAtStart(value: string) {
  return new Date(`${value}T00:00:00`)
}

function dateAtEnd(value: string) {
  return new Date(`${value}T23:59:59`)
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dueBadge(dueDate: string | null, balance: number) {
  if (!dueDate) {
    return { label: "No due date", className: "text-slate-500" }
  }

  if (balance <= 0) {
    return {
      label: "Paid",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    }
  }

  const today = startOfDay(new Date())
  const due = startOfDay(new Date(dueDate))
  const diffMs = due.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / 86400000)

  if (diffDays < 0) {
    return {
      label: `Overdue ${Math.abs(diffDays)}d`,
      className: "border-rose-200 bg-rose-50 text-rose-700",
    }
  }

  if (diffDays === 0) {
    return {
      label: "Due today",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  if (diffDays <= 7) {
    return {
      label: `Due in ${diffDays}d`,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  return {
    label: `Due in ${diffDays}d`,
    className: "border-slate-200 bg-slate-50 text-slate-600",
  }
}

function statusBadge(status: SaleStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-600/20 bg-emerald-600 text-white"
    case "OVERDUE":
      return "border-rose-600/20 bg-rose-600 text-white"
    default:
      return "border-amber-400/40 bg-amber-200 text-amber-900"
  }
}

export default function SalesTableClient({ initialSales }: Props) {
  const [rows, setRows] = useState<SaleRow[]>(initialSales)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<SaleStatus | "ALL">("ALL")
  const [balanceFilter, setBalanceFilter] = useState<"ALL" | "OPEN" | "PAID">("ALL")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    const handle = () => {
      setActionMenuId(null)
      setMenuPos(null)
    }
    window.addEventListener("click", handle)
    window.addEventListener("scroll", handle, true)
    window.addEventListener("resize", handle)
    return () => {
      window.removeEventListener("click", handle)
      window.removeEventListener("scroll", handle, true)
      window.removeEventListener("resize", handle)
    }
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()

    return rows.filter((r: any) => {
      if (status !== "ALL" && r.status !== status) return false

      const balance = calcBalance(r.totalAmount, r.paidAmount, r.balanceAmount)
      if (balanceFilter === "OPEN" && balance <= 0) return false
      if (balanceFilter === "PAID" && balance > 0) return false

      if (from || to) {
        const baseDate = r.saleDate || r.createdAt
        const rowDate = baseDate ? new Date(baseDate) : null
        if (rowDate && Number.isNaN(rowDate.valueOf())) return false
        if (from) {
          const start = dateAtStart(from)
          if (!rowDate || rowDate < start) return false
        }
        if (to) {
          const end = dateAtEnd(to)
          if (!rowDate || rowDate > end) return false
        }
      }

      if (!term) return true

      const hay = [
        r.description,
        r.id,
        r.customerName,
        r.customerEmail ?? "",
        r.customerPhone ?? "",
        r.poNumber ?? "",
        r.serviceAddress ?? "",
        r.status,
      ]
        .join(" ")
        .toLowerCase()

      return hay.includes(term)
    })
  }, [rows, q, status, balanceFilter, from, to])

  function onPaid(updatedSale: any) {
    setRows((prev) =>
      prev.map((r: any) => {
        if (r.id !== updatedSale.id) return r
        const updatedPayments = Array.isArray(updatedSale.payments)
          ? updatedSale.payments.map((p: any) => ({
              id: String(p.id),
              amount: p.amount?.toString?.() ?? "0",
              method: String(p.method),
              paidAt: new Date(p.paidAt).toISOString(),
              notes: p.notes ?? null,
            }))
          : r.payments ?? []

        return {
          ...r,
          status: updatedSale.status,
          totalAmount: updatedSale.totalAmount?.toString?.() ?? r.totalAmount,
          paidAmount: updatedSale.paidAmount?.toString?.() ?? r.paidAmount,
          balanceAmount: updatedSale.balanceAmount?.toString?.() ?? r.balanceAmount,
          paymentsCount: Array.isArray(updatedSale.payments)
            ? updatedSale.payments.length
            : r.paymentsCount,
          payments: updatedPayments,
        }
      })
    )
  }

  function openMenu(id: string, target: HTMLElement) {
    const rect = target.getBoundingClientRect()
    const menuWidth = 176
    const menuHeight = 120
    const padding = 12
    let left = rect.right - menuWidth
    if (left < padding) left = rect.left
    let top = rect.bottom + 8
    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - 8
    }
    setMenuPos({ top, left })
    setActionMenuId(id)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Customer, description, PO, email, phone..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SaleStatus | "ALL")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="ALL">All</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500">Balance</label>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            >
              <option value="ALL">All</option>
              <option value="OPEN">Has balance</option>
              <option value="PAID">Paid off</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-xs text-slate-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
            />
          </div>
          <div className="md:col-span-2 flex items-end justify-end text-xs text-slate-500">
            {filtered.length} result(s)
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 min-w-[240px]">Sale</th>
                <th className="px-4 py-3 min-w-[220px]">Customer</th>
                <th className="px-4 py-3 w-[130px]">Status</th>
                <th className="px-4 py-3 w-[160px]">Dates</th>
                <th className="px-4 py-3 w-[170px]">Amounts</th>
                <th className="px-4 py-3 text-right w-[180px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No sales found.
                  </td>
                </tr>
              ) : (
                filtered.map((r: any) => {
                  const saleDate = fmtDate(r.saleDate || r.createdAt)
                  const balance = calcBalance(r.totalAmount, r.paidAmount, r.balanceAmount)
                  const dueLabel = fmtDate(r.dueDate)
                  const badge = dueBadge(r.dueDate, balance)
                  const isExpanded = expandedId === r.id
                  const payments = r.payments ?? []
                  const isMenuOpen = actionMenuId === r.id

                  return (
                    <Fragment key={r.id}>
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">{r.description}</div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            #{r.id.slice(0, 8)} • {r.itemsCount} item(s)
                          </div>
                          {r.poNumber ? (
                            <div className="mt-1 text-[11px] text-slate-400">PO: {r.poNumber}</div>
                          ) : null}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-slate-700">{r.customerName}</div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {[r.customerEmail, r.customerPhone].filter(Boolean).join(" • ")}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className={`badge-strong border ${statusBadge(r.status)}`}>
                            {r.status}
                          </span>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {r.paymentsCount} payment(s)
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-xs text-slate-500">Sale</div>
                          <div className="text-sm text-slate-700">{saleDate || "—"}</div>
                          <div className="mt-2 text-xs text-slate-500">Due</div>
                          <div className="text-sm text-slate-700">{dueLabel || "—"}</div>
                          <div className="mt-1">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Total</span>
                            <span className="text-sm font-semibold text-slate-900">
                              {money(r.totalAmount)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>Paid</span>
                            <span className="text-sm font-semibold text-slate-700">
                              {money(r.paidAmount)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>Balance</span>
                            <span className="text-sm font-semibold text-slate-900">
                              {money(balance)}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                              <AddPaymentModal
                                saleId={r.id}
                                saleDescription={r.description}
                                remaining={balance}
                                onPaid={onPaid}
                                buttonClassName="rounded-full bg-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-teal-400 disabled:opacity-60"
                                buttonLabel="Add payment"
                              />

                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    if (isMenuOpen) {
                                      setActionMenuId(null)
                                      setMenuPos(null)
                                      return
                                    }
                                    openMenu(r.id, e.currentTarget)
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                >
                                  More
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="bg-slate-50/60">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="rounded-xl border border-slate-200 bg-white">
                              {payments.length === 0 ? (
                                <div className="p-3 text-sm text-slate-500">
                                  No payments yet.
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-200">
                                  {payments.map((p: any) => (
                                    <div
                                      key={p.id}
                                      className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                      <div className="grid gap-1 text-xs text-slate-500 sm:text-sm">
                                        <div className="text-sm font-semibold text-slate-900">
                                          {money(p.amount)}
                                        </div>
                                        <div>
                                          <span className="text-slate-400">Date:</span>{" "}
                                          <span className="text-slate-700">
                                            {fmtDate(p.paidAt) || "—"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400">Method:</span>{" "}
                                          <span className="text-slate-700">{p.method}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400">Notes:</span>{" "}
                                          <span className="text-slate-700">{p.notes || "—"}</span>
                                        </div>
                                      </div>
                                      <a
                                        href={`/payments/${p.id}/receipt`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                      >
                                        View receipt
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {actionMenuId && menuPos
          ? createPortal(
              <div
                style={{ top: menuPos.top, left: menuPos.left }}
                className="fixed z-[60] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(expandedId === actionMenuId ? null : actionMenuId)
                    setActionMenuId(null)
                    setMenuPos(null)
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
                >
                  {expandedId === actionMenuId ? "Hide payments" : "View payments"}
                </button>
                <a
                  href={`/sales/${actionMenuId}/edit`}
                  onClick={() => {
                    setActionMenuId(null)
                    setMenuPos(null)
                  }}
                  className="block px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Edit invoice
                </a>
                <a
                  href={`/sales/${actionMenuId}/invoice`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    setActionMenuId(null)
                    setMenuPos(null)
                  }}
                  className="block px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  View invoice
                </a>
              </div>,
              document.body
            )
          : null}
      </div>
    </div>
  )
}
