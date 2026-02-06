"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function ResetPasswordContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token") || ""

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Reset failed")
      setMsg("Password updated. You can now sign in.")
      setTimeout(() => router.push("/login"), 1200)
    } catch (e: any) {
      setMsg(e?.message || "Reset failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="text-[11px] uppercase tracking-[0.32em] text-slate-400">ByteLedger</div>
      <h1 className="mt-2 text-2xl font-semibold">Reset password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Set a new password (min 8 characters).
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
          disabled={loading || !password.trim() || !token}
          className="w-full rounded-2xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>

      <div className="mt-3 text-xs text-slate-500">
        <Link href="/login" className="hover:text-slate-700">
          Back to login
        </Link>
      </div>

      {msg ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          {msg}
        </div>
      ) : null}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}
