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
    saleDate: string | null
    dueDate: string | null
    poNumber: string | null
    serviceAddress: string | null
    customerName: string
    itemsCount: number
    payments: Payment[]
  }
}

function money(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

function formatDate(value?: string | null) {
  if (!value) return ""
  try {
    const d = new Date(value)
    if (Number.isNaN(d.valueOf())) return ""
    return d.toLocaleDateString()
  } catch {
    return ""
  }
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-700">
        {value ? value : <span className="text-slate-400">N/A</span>}
      </div>
    </div>
  )
}

export default function SaleCard({ sale }: Props) {
  const [state, setState] = useState({
    ...sale,
    payments: sale.payments ?? [],
  })

  const total = useMemo(() => money(state.totalAmount), [state.totalAmount])
  const paid = useMemo(() => money(state.paidAmount), [state.paidAmount])
  const balance = useMemo(() => money(state.balanceAmount), [state.balanceAmount])
  const progress = useMemo(() => {
    if (total <= 0) return 0
    return Math.min(paid / total, 1)
  }, [paid, total])

  const createdLabel = useMemo(() => {
    return formatDate(state.saleDate || state.createdAt)
  }, [state.saleDate, state.createdAt])

  const dueLabel = useMemo(() => {
    return formatDate(state.dueDate)
  }, [state.dueDate])

  const statusStyle =
    state.status === "PAID"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : state.status === "OVERDUE"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-600"

  return (
    <div className="card card-stripe p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-900">{state.description}</div>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusStyle}`}>
              Status: {state.status}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
              Items: {state.itemsCount}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Customer" value={state.customerName} />
            <DetailItem label="Sale date" value={createdLabel || null} />
            <DetailItem label="Due date" value={dueLabel || null} />
            <DetailItem label="PO number" value={state.poNumber} />
            <DetailItem label="Service address" value={state.serviceAddress} />
          </div>
        </div>

        <div className="flex items-center gap-2 lg:justify-end">
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
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            View Invoice
          </a>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500">Total</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500">Paid</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {paid.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500">Remaining</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {balance.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Payment progress</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-slate-600">Payments</div>
          <div className="text-xs text-slate-500">{state.payments.length} total</div>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {state.payments.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">No payments yet.</div>
          ) : (
            <>
              <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_2fr_auto] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500 sm:grid">
                <div>Amount</div>
                <div>Method</div>
                <div>Date</div>
                <div>Notes</div>
                <div className="text-right">Receipt</div>
              </div>
              {state.payments.map((p: any) => (
                <div
                  key={p.id}
                  className="grid grid-cols-1 gap-2 border-t border-slate-200 px-3 py-2 sm:grid-cols-[1.2fr_1fr_1.2fr_2fr_auto] sm:items-center"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {money(p.amount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                  </div>
                  <div className="text-xs text-slate-500">{p.method}</div>
                  <div className="text-xs text-slate-500">{formatDate(p.paidAt) || "—"}</div>
                  <div className="text-xs text-slate-500">{p.notes || "—"}</div>
                  <div className="flex sm:justify-end">
                    <a
                      href={`/payments/${p.id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      View receipt
                    </a>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
