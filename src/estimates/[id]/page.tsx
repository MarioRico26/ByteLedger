import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import ApproveEstimateButton from "./ui/ApproveEstimateButton"
import ConvertButton from "./ui/ConvertButton"
import DuplicateButton from "./ui/DuplicateButton"
import SendEstimateModal from "./ui/SendEstimateModal"

function money(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const estimate = await prisma.estimate.findFirst({
    where: { id, organizationId: DEFAULT_ORG_ID },
    include: {
      customer: true,
      items: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!estimate) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-400">
        Estimate not found.
      </div>
    )
  }

  const subtotal = money(estimate.subtotalAmount)
  const total = money(estimate.totalAmount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm text-zinc-400">Estimate</div>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{estimate.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-800 bg-zinc-900/40 px-2 py-0.5">
              Status: {estimate.status}
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900/40 px-2 py-0.5">
              Customer: {estimate.customer.fullName}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/estimates/${estimate.id}/quote`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            View Quote
          </Link>

          <Link
            href={`/estimates/${estimate.id}/edit`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            Edit
          </Link>

          <SendEstimateModal estimateId={estimate.id} defaultTo={estimate.customer.email || ""} />

          <DuplicateButton estimateId={estimate.id} />

          <ConvertButton estimateId={estimate.id} disabled={!!estimate.saleId} />

          <ApproveEstimateButton
            estimateId={estimate.id}
            disabled={estimate.status !== "DRAFT"}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Subtotal</div>
          <div className="mt-1 text-xl font-semibold">${subtotal.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Total</div>
          <div className="mt-1 text-xl font-semibold">${total.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Items</div>
          <div className="mt-1 text-xl font-semibold">{estimate.items.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="text-sm font-semibold text-zinc-100">Line Items</div>
        <div className="mt-3 divide-y divide-zinc-800">
          {estimate.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between py-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium text-zinc-100">{it.name}</div>
                <div className="text-xs text-zinc-500">
                  {it.type} • Qty {it.quantity}
                </div>
              </div>
              <div className="font-medium text-zinc-100">
                ${money(it.lineTotal).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
