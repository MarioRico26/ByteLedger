//byteledger/src/app/sales/[id]/invoice/PrintButton.tsx
"use client"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
    >
      Print / Save as PDF
    </button>
  )
}