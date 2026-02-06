"use client"

import { useState } from "react"

export default function SendReceiptModal({
  paymentId,
  defaultTo = "",
}: {
  paymentId: string
  defaultTo?: string
}) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(defaultTo)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function send() {
    setLoading(true)
    setMsg(null)

    try {
      const res = await fetch("/api/receipts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, to }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) setMsg(data?.error || "Failed to send receipt")
      else {
        setMsg("✅ Receipt sent successfully")
        setOpen(false)
      }
    } catch (e) {
      console.error(e)
      setMsg("Failed to send receipt")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setTo(defaultTo || "")
          setMsg(null)
          setOpen(true)
        }}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
      >
        Send Receipt
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 modal-overlay">
          <div className="mx-auto w-full max-w-md py-10">
            <div className="modal-panel card-stripe max-h-[85vh] overflow-y-auto p-6 text-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">Send Receipt</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Email the receipt PDF to your customer.
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <label className="space-y-1">
                  <div className="text-xs font-medium text-slate-600">To</div>
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </label>
              </div>

              {msg ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {msg}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>

                <button
                  disabled={loading || !to.trim()}
                  onClick={send}
                  className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
