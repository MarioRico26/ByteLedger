//byteledger/src/app/settings/organization/page.tsx:
"use client"

import { useEffect, useRef, useState } from "react"

type Org = {
  name: string
  businessName: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  recurringFrequency: string | null
  recurringDueDays: number | null
  recurringReminderDays: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

export default function OrganizationSettingsPage() {
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/organization")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setOrg(data)
      })
      .catch(() => {
        if (!active) return
        setOrg({
          name: "ByteLedger",
          businessName: null,
          phone: null,
          email: null,
          website: null,
          logoUrl: null,
          recurringFrequency: null,
          recurringDueDays: null,
          recurringReminderDays: null,
          addressLine1: null,
          addressLine2: null,
          city: null,
          state: null,
          zip: null,
          country: null,
        })
        setMsg("Could not load organization. You can still save a new profile.")
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
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

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)

    if (!pwForm.password || pwForm.password.trim().length < 8) {
      setPwMsg("Password must be at least 8 characters.")
      return
    }
    if (pwForm.password !== pwForm.confirmPassword) {
      setPwMsg("Passwords do not match.")
      return
    }

    setPwSaving(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          password: pwForm.password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to change password")
      setPwForm({ currentPassword: "", password: "", confirmPassword: "" })
      setPwMsg("Password updated successfully.")
    } catch (e: any) {
      setPwMsg(e?.message || "Failed to change password")
    } finally {
      setPwSaving(false)
    }
  }

  async function fileToLogoDataUrl(file: File) {
    const maxOutput = 256
    const scanMax = 600
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("Invalid image"))
      img.src = dataUrl
    })

    const scanScale = Math.min(scanMax / image.width, scanMax / image.height, 1)
    const scanW = Math.max(1, Math.round(image.width * scanScale))
    const scanH = Math.max(1, Math.round(image.height * scanScale))
    const scanCanvas = document.createElement("canvas")
    scanCanvas.width = scanW
    scanCanvas.height = scanH
    const scanCtx = scanCanvas.getContext("2d")
    if (!scanCtx) throw new Error("Canvas not supported")
    scanCtx.drawImage(image, 0, 0, scanW, scanH)

    const imgData = scanCtx.getImageData(0, 0, scanW, scanH)
    const data = imgData.data
    let minX = scanW
    let minY = scanH
    let maxX = 0
    let maxY = 0
    let found = false

    const isContent = (r: number, g: number, b: number, a: number) => {
      if (a < 20) return false
      return r < 245 || g < 245 || b < 245
    }

    for (let y = 0; y < scanH; y += 1) {
      for (let x = 0; x < scanW; x += 1) {
        const i = (y * scanW + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        if (isContent(r, g, b, a)) {
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
          found = true
        }
      }
    }

    if (!found) {
      // Fallback: crop by alpha only
      minX = scanW
      minY = scanH
      maxX = 0
      maxY = 0
      for (let y = 0; y < scanH; y += 1) {
        for (let x = 0; x < scanW; x += 1) {
          const i = (y * scanW + x) * 4
          const a = data[i + 3]
          if (a > 20) {
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
            found = true
          }
        }
      }
    }

    if (!found) {
      minX = 0
      minY = 0
      maxX = scanW - 1
      maxY = scanH - 1
    }

    const pad = Math.round(Math.min(scanW, scanH) * 0.05)
    minX = Math.max(0, minX - pad)
    minY = Math.max(0, minY - pad)
    maxX = Math.min(scanW - 1, maxX + pad)
    maxY = Math.min(scanH - 1, maxY + pad)

    const cropW = Math.max(1, maxX - minX + 1)
    const cropH = Math.max(1, maxY - minY + 1)
    const cropCanvas = document.createElement("canvas")
    cropCanvas.width = cropW
    cropCanvas.height = cropH
    const cropCtx = cropCanvas.getContext("2d")
    if (!cropCtx) throw new Error("Canvas not supported")
    cropCtx.drawImage(scanCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH)

    const outScale = Math.min(maxOutput / cropW, maxOutput / cropH, 1)
    const outW = Math.max(1, Math.round(cropW * outScale))
    const outH = Math.max(1, Math.round(cropH * outScale))
    const outCanvas = document.createElement("canvas")
    outCanvas.width = outW
    outCanvas.height = outH
    const outCtx = outCanvas.getContext("2d")
    if (!outCtx) throw new Error("Canvas not supported")
    outCtx.drawImage(cropCanvas, 0, 0, outW, outH)

    return outCanvas.toDataURL("image/png")
  }

  function field(k: keyof Org, label: string, placeholder?: string) {
    return (
      <label className="space-y-1">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <input
          value={(org?.[k] as any) ?? ""}
          onChange={(e) =>
            setOrg((prev) =>
              prev ? { ...prev, [k]: e.target.value } : prev
            )
          }
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-400"
        />
      </label>
    )
  }

  if (loading || !org) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">
        Loading organization settings...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Settings
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Organization Profile
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              This information appears on invoices, receipts, and customer emails.
            </p>
          </div>

          <button
            disabled={saving}
            onClick={save}
            className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-teal-200 hover:bg-teal-400 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Organization
              </div>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Company Details
              </h2>
              <div className="mt-2 text-sm text-slate-500">
                Keep your profile up to date so every document looks professional.
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Branding
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Organization logo</div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt="Organization logo"
                      className="h-24 w-24 rounded-2xl border border-slate-200 bg-white object-contain"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                      No logo
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (!["image/png", "image/jpeg"].includes(file.type)) {
                          setMsg("Logo must be a PNG or JPG file.")
                          return
                        }
                        if (file.size > 3 * 1024 * 1024) {
                          setMsg("Logo is too large. Max 3MB.")
                          return
                        }
                        try {
                          const result = await fileToLogoDataUrl(file)
                          setOrg((prev) => (prev ? { ...prev, logoUrl: result } : prev))
                          setMsg("Logo ready. Click Save Changes to apply.")
                        } catch (err: any) {
                          setMsg(err?.message || "Failed to process logo.")
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
                    >
                      Upload logo
                    </button>
                    {org.logoUrl ? (
                      <button
                        type="button"
                        onClick={() => setOrg((prev) => (prev ? { ...prev, logoUrl: null } : prev))}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  PNG/JPG recommended. We auto-crop whitespace and resize to 256px.
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Billing Automation
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  Recurring defaults
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1">
                    <span className="text-xs text-slate-500">Frequency</span>
                    <select
                      value={org.recurringFrequency || "MONTHLY"}
                      onChange={(e) =>
                        setOrg((prev) =>
                          prev ? { ...prev, recurringFrequency: e.target.value } : prev
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs text-slate-500">Payment terms (days)</span>
                    <input
                      type="number"
                      min={0}
                      value={org.recurringDueDays ?? 14}
                      onChange={(e) =>
                        setOrg((prev) =>
                          prev ? { ...prev, recurringDueDays: Number(e.target.value || 0) } : prev
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs text-slate-500">Reminders (days)</span>
                    <input
                      value={org.recurringReminderDays || "-3,0,7"}
                      onChange={(e) =>
                        setOrg((prev) =>
                          prev ? { ...prev, recurringReminderDays: e.target.value } : prev
                        )
                      }
                      placeholder="-3,0,7"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-400"
                    />
                  </label>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Use comma-separated days relative to due date. Example: -3,0,7
                </div>
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
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  {msg}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Security
              </div>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Change Password
              </h2>
              <div className="mt-2 text-sm text-slate-500">
                Use at least 8 characters. If required, enter your current password.
              </div>

              <form onSubmit={changePassword} className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs text-slate-500">Current Password</span>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-slate-500">New Password</span>
                  <input
                    type="password"
                    value={pwForm.password}
                    onChange={(e) => setPwForm((p) => ({ ...p, password: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-slate-500">Confirm Password</span>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) =>
                      setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                </label>

                {pwMsg ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    {pwMsg}
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <button
                    disabled={pwSaving}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {pwSaving ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Summary
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {org.businessName || org.name}
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-500">
                <div>{org.email || "Billing email not set"}</div>
                <div>{org.phone || "Phone not set"}</div>
                <div>{org.website || "Website not set"}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              Tip: Keep your address and email updated to avoid missing payment confirmations.
            </div>

            <div
              id="disclaimer"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Disclaimer
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                Terms of Use & Data Protection
              </div>
              <div className="mt-2 space-y-3 text-sm text-slate-500">
                <div>
                  ByteLedger is provided on an “as‑is” and “as‑available” basis. By using the
                  platform, you acknowledge responsibility for the accuracy, completeness, and
                  legality of all data entered, and for compliance with applicable laws, tax
                  rules, and regulatory requirements in your jurisdiction.
                </div>
                <div>
                  Access to organization data is limited to authorized users within your account.
                  We implement administrative, technical, and physical safeguards designed to
                  protect data, including encrypted connections and access controls. However, no
                  system can guarantee absolute security, and specific warranties or service
                  levels are governed solely by your written service agreement.
                </div>
                <div>
                  You are responsible for maintaining user access credentials, configuring user
                  permissions appropriately, and promptly notifying us of any suspected
                  unauthorized access or data incident.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
