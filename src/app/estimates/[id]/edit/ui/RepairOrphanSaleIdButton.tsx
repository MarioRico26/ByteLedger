"use client"

import { useState } from "react"

export default function RepairOrphanSaleIdButton({ estimateId }: { estimateId: string }) {
  const [loading, setLoading] = useState(false)

  async function onRepair() {
    setLoading(true)
    try {
      const res = await fetch(`/api/estimates/${estimateId}/repair`, { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "Repair failed")

      // reload so server components refetch the now-clean estimate
      window.location.reload()
    } catch (e: any) {
      alert(e?.message || "Repair failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onRepair}
      disabled={loading}
      className="rounded-xl border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-950/50 disabled:opacity-60"
    >
      {loading ? "Repairing…" : "Repair sale link"}
    </button>
  )
}