"use client"

import { useState } from "react"

export default function SendInvoiceModal({
  saleId,
  defaultTo = "",
}: {
  saleId: string
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
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId, to }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) setMsg(data?.error || "Failed to send invoice")
      else {
        setMsg("✅ Invoice sent successfully")
        setOpen(false)
      }
    } catch (e) {
      console.error(e)
      setMsg("Failed to send invoice")
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
        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-100"
      >
        Send Invoice
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
          <div className="mx-auto w-full max-w-md py-10">
            <div className="max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 text-black">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">Send Invoice</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    Email the invoice link to your customer.
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <label className="space-y-1">
                  <div className="text-xs font-medium text-zinc-600">To</div>
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  />
                </label>
              </div>

              {msg ? (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                  {msg}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>

                <button
                  disabled={loading || !to.trim()}
                  onClick={send}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
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