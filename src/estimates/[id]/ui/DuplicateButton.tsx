"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DuplicateButton({ estimateId }: { estimateId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function duplicate() {
    try {
      setLoading(true)
      const res = await fetch(`/api/estimates/${estimateId}/duplicate`, { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to duplicate")

      if (data?.id) {
        router.push(`/estimates/${data.id}/edit`)
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
      onClick={duplicate}
      disabled={loading}
      className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40 disabled:opacity-50"
      type="button"
    >
      {loading ? "Duplicating…" : "Duplicate"}
    </button>
  )
}
