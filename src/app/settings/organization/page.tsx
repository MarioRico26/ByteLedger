//byteledger/src/app/settings/organization/page.tsx:
"use client"

import { useEffect, useState } from "react"

type Org = {
  name: string
  businessName: string | null
  phone: string | null
  email: string | null
  website: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

export default function OrganizationSettingsPage() {
  const [org, setOrg] = useState<Org | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/organization")
      .then((r) => r.json())
      .then(setOrg)
      .catch(() => setOrg(null))
  }, [])

  async function save() {
    if (!org) return
    setSaving(true)
    setMsg(null)

    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(org),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to save")

      setOrg(data)
      setMsg("✅ Saved successfully")
    } catch (e: any) {
      setMsg(e?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function field(k: keyof Org, label: string, placeholder?: string) {
    return (
      <label className="space-y-1">
        <div className="text-xs font-medium text-zinc-500">{label}</div>
        <input
          value={(org?.[k] as any) ?? ""}
          onChange={(e) =>
            setOrg((prev) =>
              prev ? { ...prev, [k]: e.target.value } : prev
            )
          }
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
        />
      </label>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-black p-6 text-sm text-zinc-400">
        Loading organization settings...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
          <div className="text-xs uppercase tracking-widest text-zinc-500">
            ByteLedger
          </div>
          <h1 className="mt-1 text-2xl font-semibold">Organization Settings</h1>
          <div className="mt-2 text-sm text-zinc-400">
            This information appears on invoices and emails.
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("businessName", "Business Name", "Byte Networks LLC")}
            {field("phone", "Phone", "(555) 555-5555")}
            {field("email", "Billing Email", "info@bytenetworks.net")}
            {field("website", "Website", "https://bytenetworks.net")}

            <div className="sm:col-span-2">
              {field("addressLine1", "Address Line 1", "123 Main St")}
            </div>
            <div className="sm:col-span-2">
              {field("addressLine2", "Address Line 2", "Suite 200")}
            </div>

            {field("city", "City", "Manahawkin")}
            {field("state", "State", "NJ")}
            {field("zip", "ZIP Code", "08050")}
            {field("country", "Country", "USA")}
          </div>

          {msg ? (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-sm text-zinc-300">
              {msg}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              disabled={saving}
              onClick={save}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}