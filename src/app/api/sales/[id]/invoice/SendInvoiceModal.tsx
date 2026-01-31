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
      if (!res.ok) throw new Error(data?.error || "Failed to send invoice")

      setMsg("✅ Invoice sent")
      setOpen(false)
    } catch (e: any) {
      setMsg(e?.message || "Failed to send invoice")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Send Invoice
      </button>

      {msg ? (
        <span className="text-xs text-zinc-600">{msg}</span>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 text-black shadow-xl">
            <div className="text-lg font-semibold">Send invoice</div>
            <div className="mt-1 text-sm text-zinc-600">
              Enter the email address to send this invoice.
            </div>

            <label className="mt-4 block">
              <div className="text-xs font-medium text-zinc-600">To</div>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="customer@email.com"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </label>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
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

            <div className="mt-3 text-xs text-zinc-500">
              Sale ID: <span className="font-mono">{saleId}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}