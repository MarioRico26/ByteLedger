// byteledger/src/app/estimates/[id]/edit/page.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import EditEstimateForm from "./ui/EditEstimateForm"

export default async function EditEstimatePage({ params }: { params: { id: string } }) {
  const estimate = await prisma.estimate.findFirst({
    where: { id: params.id, organizationId: DEFAULT_ORG_ID },
    include: {
      customer: true,
      items: { orderBy: { createdAt: "asc" }, include: { product: true } },
    },
  })

  if (!estimate) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm text-zinc-300">Estimate not found.</div>
        <div className="mt-3">
          <Link className="text-sm text-zinc-200 underline" href="/estimates">
            Back to estimates
          </Link>
        </div>
      </div>
    )
  }

  // Si ya fue convertido: NO se edita.
  if (estimate.saleId) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm text-zinc-200 font-medium">This estimate is already converted.</div>
        <div className="mt-1 text-sm text-zinc-500">
          Once an estimate becomes an invoice, editing is disabled.
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/sales/${estimate.saleId}`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
          >
            Open invoice
          </Link>
          <Link
            href={`/estimates/${estimate.id}`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
          >
            Back
          </Link>
        </div>
      </div>
    )
  }

  // Convertimos a JSON friendly
  const initial = {
    id: estimate.id,
    title: estimate.title,
    status: estimate.status,
    notes: estimate.notes ?? "",
    customerId: estimate.customerId,
    taxRate: Number(estimate.taxRate ?? 0),
    discountAmount: Number(estimate.discountAmount ?? 0),
    items: estimate.items.map((it) => ({
      id: it.id,
      name: it.name,
      type: it.type,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      productId: it.productId ?? null,
    })),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Estimate</h1>
          <p className="mt-1 text-sm text-zinc-400">Update details and line items.</p>
        </div>

        <Link
          href={`/estimates/${estimate.id}`}
          className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
        >
          Back
        </Link>
      </div>

      <EditEstimateForm estimateId={estimate.id} initial={initial} />
    </div>
  )
}