"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function DuplicateButton({ estimateId }: { estimateId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDuplicate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/estimates/${estimateId}/duplicate`, {
        method: "POST",
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed")

      if (data?.estimateId) {
        router.push(`/estimates/${data.estimateId}`)
        router.refresh()
      }
    } catch (e: any) {
      alert(e?.message || "Failed to duplicate")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onDuplicate}
      disabled={loading}
      className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40 disabled:opacity-50"
    >
      {loading ? "Duplicating…" : "Duplicate"}
    </button>
  )
}
