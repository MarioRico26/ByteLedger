"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { EstimateRow, EstimateStatus } from "./EstimatesClient"

function money(n: number) {
  const v = Number.isFinite(n) ? n : 0
  return v.toFixed(2)
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
}

function statusChip(status: EstimateStatus) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-800/50 bg-emerald-950/20 text-emerald-200"
    case "SENT":
      return "border-blue-800/50 bg-blue-950/20 text-blue-200"
    case "EXPIRED":
      return "border-amber-800/50 bg-amber-950/20 text-amber-200"
    default:
      return "border-zinc-800 bg-zinc-950/30 text-zinc-200"
  }
}

export default function EstimateCard({ estimate }: { estimate: EstimateRow }) {
  const [busy, setBusy] = useState(false)
  const converted = Boolean(estimate.saleId)

  const primaryAddress = useMemo(() => {
    const c = estimate.customer
    if (!c) return null
    return c.workAddress || c.homeAddress || null
  }, [estimate.customer])

  async function onDuplicate() {
    try {
      setBusy(true)
      const res = await fetch(`/api/estimates/${estimate.id}/duplicate`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to duplicate")
      window.location.href = `/estimates/${json.estimateId}`
    } catch (e: any) {
      alert(e?.message || "Failed to duplicate")
    } finally {
      setBusy(false)
    }
  }

  async function onConvert() {
    try {
      setBusy(true)
      const res = await fetch(`/api/estimates/${estimate.id}/convert`, { method: "POST" })
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/estimates/${estimate.id}`} className="text-base font-semibold text-zinc-100 hover:underline">
              {estimate.title || "Estimate"}
            </Link>

            <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusChip(estimate.status)}`}>
              {estimate.status}
            </span>

            {converted ? (
              <span className="rounded-full border border-purple-800/50 bg-purple-950/20 px-2 py-1 text-[11px] font-semibold text-purple-200">
                Converted
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Created <span className="text-zinc-300">{fmtDate(estimate.createdAt)}</span> •{" "}
            <span className="text-zinc-300">{estimate.itemsCount}</span> items
          </div>

          <div className="mt-3 grid gap-1 text-sm">
            <div className="text-zinc-200">
              <span className="text-zinc-400">Customer:</span>{" "}
              {estimate.customer ? estimate.customer.fullName : <span className="text-zinc-500">Unknown</span>}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
              {estimate.customer?.email ? <span>{estimate.customer.email}</span> : null}
              {estimate.customer?.phone ? <span>{estimate.customer.phone}</span> : null}
              {primaryAddress ? <span className="text-zinc-500">{primaryAddress}</span> : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-zinc-400">Total</div>
          <div className="text-2xl font-semibold text-zinc-100">${money(estimate.totalAmount)}</div>

          <div className="mt-1 text-xs text-zinc-500">
            Subtotal ${money(estimate.subtotalAmount)} • Tax ${money(estimate.taxAmount)} • Discount -$
            {money(estimate.discountAmount)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/estimates/${estimate.id}`}
          className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
        >
          View
        </Link>

        <Link
          href={`/estimates/${estimate.id}/quote`}
          className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
        >
          View Quote
        </Link>

        <Link
          href={`/estimates/${estimate.id}/edit`}
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
          onClick={onDuplicate}
          disabled={busy}
          className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40 disabled:opacity-60"
        >
          Duplicate
        </button>

        <button
          onClick={onConvert}
          disabled={busy || converted}
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            converted
              ? "cursor-not-allowed border border-zinc-900 bg-zinc-950/30 text-zinc-600"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          }`}
        >
          Convert to Sale
        </button>

        {converted && estimate.saleId ? (
          <Link
            href={`/sales/${estimate.saleId}`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            Open Sale
          </Link>
        ) : null}
      </div>
    </div>
  )
}
