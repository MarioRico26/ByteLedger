"use client"

import { useMemo, useState } from "react"
type Props = {
  saleId: string
  saleDescription: string
  remaining: number
  onPaid: (updatedSale: any) => void
  buttonClassName?: string
  buttonLabel?: string
}

const METHODS = ["CASH", "ZELLE", "CARD", "CHECK", "OTHER"] as const

export default function AddPaymentModal({
  saleId,
  saleDescription,
  remaining,
  onPaid,
  buttonClassName,
  buttonLabel,
}: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>("")
  const [method, setMethod] = useState<(typeof METHODS)[number]>("CASH")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remainingFixed = useMemo(() => {
    const r = Number.isFinite(remaining) ? remaining : Number(remaining || 0)
    return Math.max(r, 0)
  }, [remaining])

  const isPaidOff = remainingFixed <= 0
  const triggerLabel = isPaidOff ? "Paid" : buttonLabel ?? "Add Payment"
  const triggerClass =
    buttonClassName ??
    "rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"

  async function submit() {
    setError(null)

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Amount must be greater than 0.")
      return
    }
    if (amt > remainingFixed) {
      setError(`Amount exceeds remaining balance ($${remainingFixed.toFixed(2)}).`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId,
          amount: amt,
          method,
          notes: notes.trim() ? notes.trim() : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to add payment")
      }

      onPaid(data)
      setOpen(false)
      setAmount("")
      setMethod("CASH")
      setNotes("")
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPaidOff}
        className={triggerClass}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500">Add payment to</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {saleDescription}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Remaining:{" "}
                  <span className="font-semibold text-slate-700">
                    {remainingFixed.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                  </span>
                </div>
              </div>

              <button
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
                  max={remainingFixed}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                />
                <div className="text-[11px] text-slate-500">
                  Max: {remainingFixed.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-slate-500">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-slate-500">Notes (optional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="deposit / partial / etc..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>

                <button
                  disabled={loading || isPaidOff}
                  onClick={submit}
                  className="rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
