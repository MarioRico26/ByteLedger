"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to send reset email")
      setMsg("If your email exists, you will receive a reset link shortly.")
    } catch (e: any) {
      setMsg(e?.message || "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="text-[11px] uppercase tracking-[0.32em] text-slate-400">ByteLedger</div>
      <h1 className="mt-2 text-2xl font-semibold">Forgot password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your email and we’ll send a reset link.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full rounded-2xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
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
