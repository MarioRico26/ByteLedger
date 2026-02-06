"use client"

import { useState } from "react"

export default function NewCustomerForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [homeAddress, setHomeAddress] = useState("")
  const [workAddress, setWorkAddress] = useState("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return alert("Name is required")

    setLoading(true)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: email || null,
          phone: phone || null,
          homeAddress: homeAddress || null,
          workAddress: workAddress || null,
          reference: reference || null,
          notes: notes || null,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to create customer")

      setFullName("")
      setEmail("")
      setPhone("")
      setHomeAddress("")
      setWorkAddress("")
      setReference("")
      setNotes("")
      setOpen(false)
      window.location.reload()
    } catch (err: any) {
      alert(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-teal-200 hover:bg-teal-400"
      >
        + New Customer
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
          <div className="mx-auto w-full max-w-2xl py-10">
            <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">New Customer</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Store contact + optional addresses.
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submit} className="mt-5 space-y-4">
                <Field label="Full name *">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Email">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                    />
                  </Field>

                  <Field label="Phone">
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                    />
                  </Field>
                </div>

                <Field label="Home address">
                  <input
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                </Field>

                <Field label="Work address">
                  <input
                    value={workAddress}
                    onChange={(e) => setWorkAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Reference">
                    <input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                    />
                  </Field>

                  <Field label="Notes">
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={loading}
                    type="submit"
                    className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-60"
                  >
                    {loading ? "Saving..." : "Create"}
                  </button>
                </div>
              </form>
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
      <div className="text-xs text-slate-500">{label}</div>
      {children}
    </label>
  )
}
