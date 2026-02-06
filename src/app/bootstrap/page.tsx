"use client"

import { useState } from "react"

export default function BootstrapPage() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    orgName: "",
    businessName: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Bootstrap failed")
      setMsg("Superadmin created. Now go to /login and sign in.")
    } catch (e: any) {
      setMsg(e?.message || "Bootstrap failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="text-[11px] uppercase tracking-[0.32em] text-slate-400">ByteLedger</div>
      <h1 className="mt-2 text-2xl font-semibold">Bootstrap Superadmin</h1>
      <p className="mt-1 text-sm text-slate-500">
        One-time setup to create the first superadmin and organization.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Your email *</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Your name</span>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Organization name *</span>
          <input
            value={form.orgName}
            onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Business name</span>
          <input
            value={form.businessName}
            onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Password *</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !form.email.trim() || !form.orgName.trim() || !form.password.trim()}
          className="w-full rounded-2xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create superadmin"}
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
