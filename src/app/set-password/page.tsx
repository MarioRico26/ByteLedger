"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to update password")
      setMsg("Password updated. Redirecting...")
      setTimeout(() => router.push("/"), 1000)
    } catch (e: any) {
      setMsg(e?.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="text-[11px] uppercase tracking-[0.32em] text-slate-400">ByteLedger</div>
      <h1 className="mt-2 text-2xl font-semibold">Set your password</h1>
      <p className="mt-1 text-sm text-slate-500">
        This is required on first login.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="w-full rounded-2xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save password"}
        </button>
      </form>

      {msg ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          {msg}
        </div>
      ) : null}
    </div>
  )
}
