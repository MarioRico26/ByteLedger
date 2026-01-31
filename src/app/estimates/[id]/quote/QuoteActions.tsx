// src/app/estimates/quote/QuoteActions.tsx
"use client"

import { useState } from "react"
import PrintButton from "./PrintButton"

export default function QuoteActions({ estimateId, defaultTo }: { estimateId: string; defaultTo?: string }) {
  const [to, setTo] = useState(defaultTo ?? "")
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <PrintButton />

      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="email@client.com"
          className="w-44 bg-transparent text-xs text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <button
          disabled={loading || !to}
          onClick={async () => {
            setLoading(true)
            try {
              const res = await fetch("/api/estimates/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estimateId, to }),
              })
              if (!res.ok) {
                alert("Failed to send")
                return
              }
              alert("Sent")
            } finally {
              setLoading(false)
            }
          }}
          className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs font-medium text-zinc-100 hover:bg-zinc-900/40 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  )
}