"use client"

export default function PrintQuoteButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-900/40"
      type="button"
    >
      Print / Save PDF
    </button>
  )
}
