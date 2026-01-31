"use client"

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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-zinc-100">
              {customer.fullName}
            </div>

            {customer.reference ? (
              <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[10px] text-zinc-300">
                Ref: {customer.reference}
              </span>
            ) : null}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3">
              <div className="text-[11px] text-zinc-500">Contact</div>
              <div className="mt-1 text-sm text-zinc-200">
                {customer.email || <span className="text-zinc-500">No email</span>}
              </div>
              <div className="mt-1 text-sm text-zinc-200">
                {customer.phone || <span className="text-zinc-500">No phone</span>}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3">
              <div className="text-[11px] text-zinc-500">Addresses</div>
              <div className="mt-1 text-sm text-zinc-200">
                Home:{" "}
                {customer.homeAddress || <span className="text-zinc-500">N/A</span>}
              </div>
              <div className="mt-1 text-sm text-zinc-200">
                Work:{" "}
                {customer.workAddress || <span className="text-zinc-500">N/A</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:justify-end">
          <EditCustomerModal customer={customer} onSaved={onUpdated} />

          <button
            onClick={remove}
            className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-950/30"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}