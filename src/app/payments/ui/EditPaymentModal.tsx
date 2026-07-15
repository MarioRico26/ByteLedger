"use client"

import { useState } from "react"
import type { PaymentRow } from "./PaymentsTableClient"

const METHODS = ["CASH", "ZELLE", "CARD", "CHECK", "OTHER"] as const

function todayInputValue(iso?: string | null) {
  if (iso) {
    const d = new Date(iso)
    if (!Number.isNaN(d.valueOf())) {
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      return local.toISOString().slice(0, 10)
    }
  }
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export default function EditPaymentModal({
  payment,
  onSaved,
}: {
  payment: PaymentRow
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(payment.amount || "0"))
  const [method, setMethod] = useState<(typeof METHODS)[number]>((METHODS.includes(payment.method as any) ? payment.method : "CASH") as (typeof METHODS)[number])
  const [paidAt, setPaidAt] = useState(todayInputValue(payment.paidAt))
  const [notes, setNotes] = useState(payment.notes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Amount must be greater than 0.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          method,
          paidAt: paidAt || null,
          notes: notes.trim() ? notes.trim() : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to update payment")
      setOpen(false)
      onSaved()
    } catch (e: any) {
      setError(e?.message || "Failed to update payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
      >
        Edit
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="modal-panel card-stripe w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">Edit Payment</div>
                <div className="mt-1 text-sm text-slate-500">
                  {payment.customerName || payment.saleDescription || payment.id}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-slate-500">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs text-slate-500">Payment date</label>
                  <input
                    type="date"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-xs text-slate-500">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as (typeof METHODS)[number])}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  >
                    {METHODS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-slate-500">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={submit}
                  className="rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
