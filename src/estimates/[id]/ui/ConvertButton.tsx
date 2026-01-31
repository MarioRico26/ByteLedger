"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ConvertButton({
  estimateId,
  disabled,
}: {
  estimateId: string
  disabled?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function convert() {
    try {
      setLoading(true)
      const res = await fetch(`/api/estimates/${estimateId}/convert`, { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to convert")

      if (data?.saleId) {
        router.push(`/sales/${data.saleId}/invoice`)
        return
      }

      router.refresh()
      alert("Converted to sale.")
    } catch (e: any) {
      alert(e?.message || "Failed to convert")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={convert}
      disabled={disabled || loading}
      className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-950/50 disabled:opacity-50"
      type="button"
      title={disabled ? "Already converted" : "Convert estimate to sale"}
    >
      {loading ? "Converting…" : "Convert to Sale"}
    </button>
  )
}
