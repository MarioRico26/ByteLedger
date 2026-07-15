"use client"

export default function PrintStatementButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400"
    >
      Print
    </button>
  )
}
