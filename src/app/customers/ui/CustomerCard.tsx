"use client"

import { useMemo, useState } from "react"
import EditCustomerModal from "./EditCustomerModal"
import type { CustomerDTO } from "./CustomersClient"

export default function CustomerCard({
  customer,
  onUpdated,
  onDeleted,
}: {
  customer: CustomerDTO
  onUpdated: (c: CustomerDTO) => void
  onDeleted: (id: string) => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  const contactLine = useMemo(() => {
    const parts = [
      customer.email ? `Email: ${customer.email}` : null,
      customer.phone ? `Phone: ${customer.phone}` : null,
    ].filter(Boolean)
    return parts.length ? parts.join(" • ") : "No email or phone"
  }, [customer.email, customer.phone])

  const recentSummary = useMemo(() => {
    const est = customer.recentEstimates.length
    const sal = customer.recentSales.length
    if (est === 0 && sal === 0) return "Recent: none"
    return `Recent: ${est} estimate${est === 1 ? "" : "s"} • ${sal} invoice${sal === 1 ? "" : "s"}`
  }, [customer.recentEstimates.length, customer.recentSales.length])

  async function remove() {
    if (!confirm("Delete this customer? This can fail if it has sales/estimates.")) return

    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      alert(data?.error || "Failed to delete")
      return
    }

    onDeleted(customer.id)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-900">
              {customer.fullName}
            </div>

            {customer.reference ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                Ref: {customer.reference}
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-[11px] text-slate-500">{contactLine}</div>
          <div className="mt-1 text-[11px] text-slate-500">{recentSummary}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            {showDetails ? "Hide details" : "Details"}
          </button>
          <a
            href={`/estimates/new?customerId=${customer.id}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            New Estimate
          </a>
          <a
            href={`/sales?customerId=${customer.id}&new=1`}
            className="rounded-full bg-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-teal-400"
          >
            New Sale
          </a>
          <EditCustomerModal customer={customer} onSaved={onUpdated} />
          <button
            onClick={remove}
            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
          >
            Delete
          </button>
        </div>
      </div>

      {showDetails ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Addresses</div>
            <div className="mt-1 text-sm text-slate-700">
              Home: {customer.homeAddress || <span className="text-slate-400">N/A</span>}
            </div>
            <div className="mt-1 text-sm text-slate-700">
              Work: {customer.workAddress || <span className="text-slate-400">N/A</span>}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-1 lg:col-span-2">
            <div className="text-[11px] text-slate-500">Recent activity</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {customer.recentEstimates.map((e) => (
                <a
                  key={e.id}
                  href={`/estimates/${e.id}/quote`}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Quote #{e.id.slice(0, 6)} •{" "}
                  {Number(e.totalAmount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </a>
              ))}
              {customer.recentSales.map((s) => (
                <a
                  key={s.id}
                  href={`/sales/${s.id}/invoice`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Invoice #{s.id.slice(0, 6)} •{" "}
                  {Number(s.totalAmount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </a>
              ))}
              {customer.recentEstimates.length === 0 && customer.recentSales.length === 0 ? (
                <span className="text-[11px] text-slate-400">No recent activity</span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
