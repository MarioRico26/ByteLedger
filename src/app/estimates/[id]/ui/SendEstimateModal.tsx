"use client"

import { useState } from "react"

export default function SendEstimateModal({
  estimateId,
  defaultTo = "",
}: {
  estimateId: string
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
      const res = await fetch("/api/estimates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId, to }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMsg(data?.error || "Failed to send quote")
      else {
        setMsg("✅ Quote sent successfully")
        setOpen(false)
      }
    } catch (e) {
      console.error(e)
      setMsg("Failed to send quote")
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
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
      >
        Send Quote
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
          <div className="mx-auto w-full max-w-md py-10">
            <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">Send Quote</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    Email the quote link to your customer.
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <label className="space-y-1">
                  <div className="text-xs font-medium text-zinc-400">To</div>
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                  />
                </label>
              </div>

              {msg ? (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-sm text-zinc-200">
                  {msg}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                >
                  Cancel
                </button>

                <button
                  disabled={loading || !to.trim()}
                  onClick={send}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
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