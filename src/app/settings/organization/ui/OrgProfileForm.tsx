"use client"

import { useEffect, useState } from "react"

type OrgProfile = {
  businessName: string | null
  email: string | null
  phone: string | null
  website: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

const empty: OrgProfile = {
  businessName: null,
  email: null,
  phone: null,
  website: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  zip: null,
  country: null,
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <label className="space-y-1">
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
      />
    </label>
  )
}

export default function OrgProfileForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [org, setOrg] = useState<OrgProfile>(empty)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const res = await fetch("/api/organization/profile", { cache: "no-store" })
        const data = await res.json()

        if (!active) return

        if (!res.ok) {
          setMsg(data?.error || "Failed to load organization")
          setOrg(empty)
        } else {
          setOrg({
            businessName: data.businessName ?? null,
            email: data.email ?? null,
            phone: data.phone ?? null,
            website: data.website ?? null,
            addressLine1: data.addressLine1 ?? null,
            addressLine2: data.addressLine2 ?? null,
            city: data.city ?? null,
            state: data.state ?? null,
            zip: data.zip ?? null,
            country: data.country ?? null,
          })
        }
      } catch (e) {
        console.error(e)
        setMsg("Failed to load organization")
      } finally {
        setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  async function save() {
    setSaving(true)
    setMsg(null)

    try {
      const res = await fetch("/api/organization/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(org),
      })

      const data = await res.json()

      if (!res.ok) {
        setMsg(data?.error || "Failed to save")
      } else {
        setOrg({
          businessName: data.businessName ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          website: data.website ?? null,
          addressLine1: data.addressLine1 ?? null,
          addressLine2: data.addressLine2 ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          zip: data.zip ?? null,
          country: data.country ?? null,
        })
        setMsg("✅ Saved successfully")
      }
    } catch (e) {
      console.error(e)
      setMsg("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-400">
        Loading organization profile...
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-zinc-100">
            Billing Profile
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            This info appears on your invoices.
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {msg ? (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-sm text-zinc-300">
          {msg}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Business Name"
          value={org.businessName ?? ""}
          placeholder="Byte Networks"
          onChange={(v) => setOrg((p) => ({ ...p, businessName: v }))}
        />
        <Input
          label="Email"
          value={org.email ?? ""}
          placeholder="info@bytenetworks.net"
          onChange={(v) => setOrg((p) => ({ ...p, email: v }))}
        />
        <Input
          label="Phone"
          value={org.phone ?? ""}
          placeholder="+1 (732) 000-0000"
          onChange={(v) => setOrg((p) => ({ ...p, phone: v }))}
        />
        <Input
          label="Website"
          value={org.website ?? ""}
          placeholder="bytenetworks.net"
          onChange={(v) => setOrg((p) => ({ ...p, website: v }))}
        />

        <div className="md:col-span-2">
          <Input
            label="Address Line 1"
            value={org.addressLine1 ?? ""}
            placeholder="Street address"
            onChange={(v) => setOrg((p) => ({ ...p, addressLine1: v }))}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Address Line 2"
            value={org.addressLine2 ?? ""}
            placeholder="Suite, Unit, etc (optional)"
            onChange={(v) => setOrg((p) => ({ ...p, addressLine2: v }))}
          />
        </div>

        <Input
          label="City"
          value={org.city ?? ""}
          placeholder="Manahawkin"
          onChange={(v) => setOrg((p) => ({ ...p, city: v }))}
        />
        <Input
          label="State"
          value={org.state ?? ""}
          placeholder="NJ"
          onChange={(v) => setOrg((p) => ({ ...p, state: v }))}
        />
        <Input
          label="ZIP"
          value={org.zip ?? ""}
          placeholder="08050"
          onChange={(v) => setOrg((p) => ({ ...p, zip: v }))}
        />
        <Input
          label="Country"
          value={org.country ?? ""}
          placeholder="United States"
          onChange={(v) => setOrg((p) => ({ ...p, country: v }))}
        />
      </div>
    </div>
  )
}