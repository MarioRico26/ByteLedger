"use client"

import { useMemo, useState } from "react"
import SearchableSelect from "@/components/SearchableSelect"

type Props = {
  saleId: string
  saleDescription: string
  remaining: number
  onPaid: (updatedSale: any) => void
}

const METHODS = ["CASH", "ZELLE", "CARD", "CHECK", "OTHER"] as const

export default function AddPaymentModal({
  saleId,
  saleDescription,
  remaining,
  onPaid,
}: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>("")
  const [method, setMethod] = useState<(typeof METHODS)[number]>("CASH")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remainingFixed = useMemo(() => {
    const r = Number.isFinite(remaining) ? remaining : 0
    return Math.max(r, 0)
  }, [remaining])

  async function submit() {
    setError(null)

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Amount must be greater than 0.")
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
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
      >
        Add Payment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-400">Add payment to</div>
                <div className="mt-1 text-lg font-semibold text-zinc-100">
                  {saleDescription}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  Remaining:{" "}
                  <span className="font-semibold text-zinc-200">
                    ${remainingFixed.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-zinc-400">Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-zinc-400">Method</label>
                <SearchableSelect
                  value={method}
                  onChange={(v) => setMethod(v as any)}
                  options={METHODS.map((m) => ({ value: m, label: m }))}
                  placeholder="Select method"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-zinc-400">Notes (optional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="deposit / partial / etc..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                >
                  Cancel
                </button>

                <button
                  disabled={loading}
                  onClick={submit}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
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