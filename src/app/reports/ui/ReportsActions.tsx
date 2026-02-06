"use client"

export default function ReportsActions({ exportHref }: { exportHref: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={exportHref}
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
      >
        Export CSV
      </a>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
      >
        Print / PDF
      </button>
      <a
        href="/sales"
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
      >
        Go to Sales
      </a>
    </div>
  )
}
