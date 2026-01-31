"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ApproveEstimateButton({ estimateId }: { estimateId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function approve() {
    try {
      setLoading(true)

      const res = await fetch("/api/estimates/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data?.error || "Failed to approve estimate")
        return
      }

      // ✅ go to Sales page (or specific sale invoice)
      router.push("/sales")
      router.refresh()
    } catch (e: any) {
      alert(e?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={approve}
      disabled={loading}
      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
    >
      {loading ? "Approving..." : "Approve & Create Sale"}
    </button>
  )
}