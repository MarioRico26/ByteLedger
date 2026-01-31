"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import EstimateCard from "./EstimateCard"

export type EstimateStatus = "DRAFT" | "SENT" | "APPROVED" | "EXPIRED"

export type EstimateRow = {
  id: string
  title: string
  status: EstimateStatus
  createdAt: string
  totalAmount: number
  subtotalAmount: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  saleId: string | null
  itemsCount: number
  customer: {
    id: string
    fullName: string
    email: string | null
    phone: string | null
    homeAddress: string | null
    workAddress: string | null
  } | null
}

function asString(v: unknown) {
  return typeof v === "string" ? v : ""
}

export default function EstimatesClient(props: { initialEstimates: EstimateRow[] }) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"" | EstimateStatus>("")
  const [onlyOpen, setOnlyOpen] = useState(false)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    return props.initialEstimates
      .filter((e) => {
        if (onlyOpen && e.saleId) return false
        if (status && e.status !== status) return false
        if (!query) return true

        const hay = [
          e.title,
          e.customer?.fullName,
          e.customer?.email,
          e.customer?.phone,
          e.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return hay.includes(query)
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [q, status, onlyOpen, props.initialEstimates])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estimates</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Quotes with customer context, tax and discounts. Mostly civilized.
          </p>
        </div>

        <Link
          href="/estimates/new"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New Estimate
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="grid gap-3 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <label className="text-xs text-zinc-400">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title, customer, email, phone…"
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(asString(e.target.value) as any)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              <option value="">All</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs text-zinc-400">Options</label>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyOpen((v) => !v)}
                className={`w-full rounded-xl border px-3 py-2 text-sm font-medium ${
                  onlyOpen
                    ? "border-blue-500/50 bg-blue-950/30 text-blue-200"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-200 hover:bg-zinc-900/40"
                }`}
              >
                {onlyOpen ? "Only not converted" : "Show all"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Showing <span className="text-zinc-300">{filtered.length}</span> of{" "}
          <span className="text-zinc-300">{props.initialEstimates.length}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-500">
          No estimates match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <EstimateCard key={e.id} estimate={e} />
          ))}
        </div>
      )}
    </div>
  )
}
