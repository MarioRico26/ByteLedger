"use client"

import Link from "next/link"
import { useState } from "react"

function SendQuoteModal(props: { estimateId: string; defaultTo?: string }) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(props.defaultTo || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setError(null)
    if (!to.trim()) {
      setError("Email is required.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/estimates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId: props.estimateId, to }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to send")
      setOpen(false)
    } catch (e: any) {
      setError(e?.message || "Failed to send")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40 print:hidden"
      >
        Send Email
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-zinc-100">Send quote</div>
                <div className="mt-1 text-sm text-zinc-400">We’ll email a link to the public quote.</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/40"
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs text-zinc-400">To</label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                placeholder="client@email.com"
              />
              {error ? <div className="mt-2 text-sm text-red-300">{error}</div> : null}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default function QuoteActions(props: { estimateId: string; saleId: string | null; status: string; defaultTo?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
      <Link
        href={`/estimates/${props.estimateId}`}
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
      >
        Back to estimate
      </Link>

      <button
        onClick={() => window.print()}
        className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        Print / Save PDF
      </button>

      <SendQuoteModal estimateId={props.estimateId} defaultTo={props.defaultTo} />

      {props.saleId ? (
        <Link
          href={`/sales/${props.saleId}`}
          className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
        >
          Open sale
        </Link>
      ) : null}

      <div className="ml-auto text-xs text-zinc-500">
        Status: <span className="text-zinc-300">{props.status}</span>
      </div>
    </div>
  )
}
