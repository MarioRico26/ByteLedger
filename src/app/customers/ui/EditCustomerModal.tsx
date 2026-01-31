"use client"

import { useEffect, useState } from "react"
import type { CustomerDTO } from "./CustomersClient"

export default function EditCustomerModal({
  customer,
  onSaved,
}: {
  customer: CustomerDTO
  onSaved: (c: CustomerDTO) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    fullName: customer.fullName,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    homeAddress: customer.homeAddress ?? "",
    workAddress: customer.workAddress ?? "",
    reference: customer.reference ?? "",
    notes: customer.notes ?? "",
  })

  useEffect(() => {
    // si cambias customer (por filtro/update), resetea
    setForm({
      fullName: customer.fullName,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      homeAddress: customer.homeAddress ?? "",
      workAddress: customer.workAddress ?? "",
      reference: customer.reference ?? "",
      notes: customer.notes ?? "",
    })
  }, [customer])

  async function save() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || null,
          phone: form.phone || null,
          homeAddress: form.homeAddress || null,
          workAddress: form.workAddress || null,
          reference: form.reference || null,
          notes: form.notes || null,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to save")

      onSaved({
        ...customer,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        homeAddress: data.homeAddress,
        workAddress: data.workAddress,
        reference: data.reference,
        notes: data.notes,
      })

      setMsg("✅ Saved")
      setOpen(false)
    } catch (e: any) {
      setMsg(e?.message || "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setMsg(null)
          setOpen(true)
        }}
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
      >
        Edit
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">Edit customer</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Update contact + addresses. Notes stay here, not in the list.
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name *">
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </Field>

              <Field label="Reference">
                <input
                  value={form.reference}
                  onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </Field>

              <Field label="Email">
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </Field>

              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </Field>

              <Field label="Home address">
                <input
                  value={form.homeAddress}
                  onChange={(e) => setForm((p) => ({ ...p, homeAddress: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </Field>

              <Field label="Work address">
                <input
                  value={form.workAddress}
                  onChange={(e) => setForm((p) => ({ ...p, workAddress: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Notes (internal)">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    className="h-24 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  />
                </Field>
              </div>
            </div>

            {msg ? (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-3 text-sm text-zinc-300">
                {msg}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                disabled={loading}
                onClick={save}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="text-xs text-zinc-400">{label}</div>
      {children}
    </label>
  )
}