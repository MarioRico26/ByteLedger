"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import type { CustomerDTO } from "./CustomersClient"

export default function EditCustomerModal({
  customer,
  onSaved,
}: {
  customer: CustomerDTO
  onSaved: (c: CustomerDTO) => void
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const seedForm = useMemo(
    () => ({
      fullName: customer.fullName,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      homeAddress: customer.homeAddress ?? "",
      workAddress: customer.workAddress ?? "",
      reference: customer.reference ?? "",
      notes: customer.notes ?? "",
    }),
    [customer]
  )

  const [form, setForm] = useState(seedForm)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!open) {
      setForm(seedForm)
    }
  }, [open, seedForm])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

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

      setMsg("Saved")
      setOpen(false)
    } catch (e: any) {
      setMsg(e?.message || "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="w-full max-w-2xl modal-panel card-stripe p-6 text-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Edit customer</div>
            <div className="mt-1 text-sm text-slate-500">
              Update contact + addresses. Notes stay here, not in the list.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            X
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <input
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </Field>

          <Field label="Reference">
            <input
              value={form.reference}
              onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </Field>

          <Field label="Email">
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </Field>

          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </Field>

          <Field label="Home address">
            <input
              value={form.homeAddress}
              onChange={(e) => setForm((p) => ({ ...p, homeAddress: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </Field>

          <Field label="Work address">
            <input
              value={form.workAddress}
              onChange={(e) => setForm((p) => ({ ...p, workAddress: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Notes (internal)">
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
            </Field>
          </div>
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            {msg}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={save}
            className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMsg(null)
          setOpen(true)
        }}
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
      >
        Edit
      </button>

      {open && mounted ? createPortal(modalContent, document.body) : null}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="text-xs text-slate-500">{label}</div>
      {children}
    </label>
  )
}
