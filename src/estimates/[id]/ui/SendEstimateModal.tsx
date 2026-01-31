// byteledger/src/app/estimates/[id]/ui/SendEstimateModal.tsx
"use client"

import { useState } from "react"

type Props = {
  estimateId: string
  estimateTitle: string
  defaultEmail?: string | null
}

export default function SendEstimateModal({
  estimateId,
  estimateTitle,
  defaultEmail,
}: Props) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(defaultEmail ?? "")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function send() {
    setMsg(null)
    setLoading(true)

    try {
      const res = await fetch("/api/estimates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId, to }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send email")
      }

      setMsg("✅ Quote sent successfully.")
      setTimeout(() => {
        setOpen(false)
        setMsg(null)
      }, 800)
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Failed to send email"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900/40"
      >
        Send Quote
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-xl">
            <div className="text-lg font-semibold">Send Quote</div>
            <div className="mt-1 text-sm text-zinc-400">{estimateTitle}</div>

            <div className="mt-4">
              <label className="text-xs font-medium text-zinc-400">To</label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="client@email.com"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              />
            </div>

            {msg && (
              <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/20 p-3 text-sm text-zinc-300">
                {msg}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900/40"
              >
                Cancel
              </button>

              <button
                disabled={loading || !to.trim()}
                onClick={send}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}