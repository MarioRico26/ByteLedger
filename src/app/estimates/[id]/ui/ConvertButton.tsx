"use client"

import { useState } from "react"

export default function ConvertButton({
  estimateId,
  status,
}: {
  estimateId: string
  status: string
}) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const disabled = loading || status === "APPROVED"

  async function convert() {
    setMsg(null)
    setLoading(true)

    try {
      const res = await fetch("/api/estimates/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId }),
      })

      const text = await res.text()

      let data: any = null
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `Convert failed (${res.status}). Response:\n${text.slice(0, 160)}`
        )
      }

      setMsg("✅ Converted to Invoice")
      setTimeout(() => setMsg(null), 1500)

      // ✅ Si quieres ir directo a la factura
      if (data?.saleId) {
        window.location.href = `/sales/${data.saleId}/invoice`
      }
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "Error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={convert}
        disabled={disabled}
        className={`rounded-xl px-4 py-2 text-sm font-semibold ${
          disabled
            ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
            : "bg-white text-black hover:bg-zinc-200"
        }`}
      >
        {loading ? "Converting..." : status === "APPROVED" ? "Converted ✅" : "Convert to Invoice"}
      </button>

      {msg && <div className="text-xs text-zinc-400">{msg}</div>}
    </div>
  )
}