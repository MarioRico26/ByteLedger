
//byteledger/src/app/sales/ui/SaleCard.tsx:
"use client"

import { useMemo, useState } from "react"
import AddPaymentModal from "./AddPaymentModal"

type Payment = {
  id: string
  amount: string
  method: string
  paidAt: string
  notes: string | null
}

type Props = {
  sale: {
    id: string
    description: string
    status: string
    totalAmount: string
    paidAmount: string
    balanceAmount: string
    createdAt: string
    customerName: string
    itemsCount: number
    payments: Payment[]
  }
}

function money(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export default function SaleCard({ sale }: Props) {
  const [state, setState] = useState({
    ...sale,
    payments: sale.payments ?? [],
  })

  const total = useMemo(() => money(state.totalAmount), [state.totalAmount])
  const paid = useMemo(() => money(state.paidAmount), [state.paidAmount])
  const balance = useMemo(() => money(state.balanceAmount), [state.balanceAmount])

  const createdLabel = useMemo(() => {
    try {
      return new Date(state.createdAt).toLocaleDateString()
    } catch {
      return ""
    }
  }, [state.createdAt])

  const statusStyle =
    state.status === "PAID"
      ? "border-emerald-900/40 bg-emerald-950/30 text-emerald-200"
      : state.status === "OVERDUE"
      ? "border-red-900/40 bg-red-950/30 text-red-200"
      : "border-zinc-800 bg-zinc-900/30 text-zinc-300"

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-zinc-100">
              {state.description}
            </div>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusStyle}`}>
              {state.status}
            </span>

            <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[10px] text-zinc-400">
              {state.itemsCount} item(s)
            </span>

            {createdLabel && (
              <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[10px] text-zinc-500">
                {createdLabel}
              </span>
            )}
          </div>

          <div className="mt-1 text-xs text-zinc-500">{state.customerName}</div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <AddPaymentModal
            saleId={state.id}
            saleDescription={state.description}
            remaining={balance}
            onPaid={(updatedSale) => {
              setState((prev) => ({
                ...prev,
                status: updatedSale.status,
                totalAmount: updatedSale.totalAmount.toString(),
                paidAmount: updatedSale.paidAmount.toString(),
                balanceAmount: updatedSale.balanceAmount.toString(),
                payments: (updatedSale.payments || []).map((p: any) => ({
                  id: p.id,
                  amount: p.amount.toString(),
                  method: p.method,
                  paidAt: new Date(p.paidAt).toISOString(),
                  notes: p.notes ?? null,
                })),
              }))
            }}
          />

          <a
            href={`/sales/${state.id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            View Invoice
          </a>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3">
          <div className="text-[11px] text-zinc-500">Total</div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">
            ${total.toFixed(2)}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3">
          <div className="text-[11px] text-zinc-500">Paid</div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">
            ${paid.toFixed(2)}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3">
          <div className="text-[11px] text-zinc-500">Remaining</div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Payments list */}
      <div className="mt-4">
        <div className="text-xs font-medium text-zinc-300">Payments</div>

        <div className="mt-2 space-y-2">
          {state.payments.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3 text-sm text-zinc-500">
              No payments yet.
            </div>
          ) : (
            state.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-100">
                    ${money(p.amount).toFixed(2)}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {p.method} • {new Date(p.paidAt).toLocaleDateString()}
                    {p.notes ? ` • ${p.notes}` : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}