"use client"

export default function ReportsActions({ exportHref }: { exportHref: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={exportHref}
        className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm"
      >
        Export CSV
      </a>
      <button
        onClick={() => window.print()}
        className="btn-accent inline-flex items-center justify-center px-4 py-2 text-sm"
      >
        Print / PDF
      </button>
      <a
        href="/sales"
        className="btn-secondary inline-flex items-center justify-center px-4 py-2 text-sm"
      >
        Go to Sales
      </a>
    </div>
  )
}
