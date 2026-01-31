"use client"

import Link from "next/link"
import { useState } from "react"

export default function EstimateActions(props: { estimateId: string; saleId: string | null }) {
  const [busy, setBusy] = useState(false)
  const converted = Boolean(props.saleId)

  async function duplicate() {
    try {
      setBusy(true)
      const res = await fetch(`/api/estimates/${props.estimateId}/duplicate`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to duplicate")
      window.location.href = `/estimates/${json.estimateId}`
    } catch (e: any) {
      alert(e?.message || "Failed to duplicate")
    } finally {
      setBusy(false)
    }
  }

  async function convert() {
    try {
      setBusy(true)
      const res = await fetch(`/api/estimates/${props.estimateId}/convert`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to convert")
      window.location.href = `/sales/${json.saleId}`
    } catch (e: any) {
      alert(e?.message || "Failed to convert")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/estimates/${props.estimateId}/quote`}
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
      >
        View Quote
      </Link>

      <Link
        href={`/estimates/${props.estimateId}/edit`}
        aria-disabled={converted}
        className={`rounded-xl border px-3 py-2 text-sm font-medium ${
          converted
            ? "cursor-not-allowed border-zinc-900 bg-zinc-950/30 text-zinc-600"
            : "border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900/40"
        }`}
      >
        Edit
      </Link>

      <button
        onClick={duplicate}
        disabled={busy}
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40 disabled:opacity-60"
      >
        Duplicate
      </button>

      <button
        onClick={convert}
        disabled={busy || converted}
        className={`rounded-xl px-3 py-2 text-sm font-semibold ${
          converted
            ? "cursor-not-allowed border border-zinc-900 bg-zinc-950/30 text-zinc-600"
            : "bg-emerald-600 text-white hover:bg-emerald-500"
        }`}
      >
        Convert to Sale
      </button>

      {converted && props.saleId ? (
        <Link
          href={`/sales/${props.saleId}`}
          className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
        >
          Open Sale
        </Link>
      ) : null}
    </div>
  )
}
