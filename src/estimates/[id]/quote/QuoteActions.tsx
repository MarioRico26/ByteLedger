"use client"

import Link from "next/link"
import SendEstimateModal from "../ui/SendEstimateModal"
import ConvertButton from "../ui/ConvertButton"
import DuplicateButton from "../ui/DuplicateButton"

export default function QuoteActions({
  estimateId,
  saleId,
  status,
  defaultEmail,
}: {
  estimateId: string
  saleId: string | null
  status: string
  defaultEmail: string | null
}) {
  async function doPrint() {
    window.print()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/estimates/${estimateId}`}
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
      >
        Back to Estimate
      </Link>

      <button
        onClick={doPrint}
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
        type="button"
      >
        Print / Save PDF
      </button>

      <SendEstimateModal estimateId={estimateId} defaultTo={defaultEmail || ""} />

      <DuplicateButton estimateId={estimateId} />

      <ConvertButton estimateId={estimateId} disabled={!!saleId} />
    </div>
  )
}
