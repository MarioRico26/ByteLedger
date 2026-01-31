// byteledger/src/app/estimates/quote/QuoteActions.tsx
"use client"

import Link from "next/link"
import { useState } from "react"

export default function QuoteActions({
  estimateId,
  defaultTo,
  backHref,
}: {
  estimateId: string
  defaultTo?: string
  backHref: string
}) {
  const [to, setTo] = useState(defaultTo || "")
  const [sending, setSending] = useState(false)

  async function send() {
    if (!to.trim()) {
      alert("Enter an email address.")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/estimates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId, to }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to send")
      alert("Email sent.")
    } catch (e: any) {
      alert(e?.message || "Failed to send")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={backHref}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
          >
            Back
          </Link>

          <button
            onClick={() => window.print()}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="customer@email.com"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 sm:w-64"
          />
          <button
            onClick={send}
            disabled={sending}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  )
}