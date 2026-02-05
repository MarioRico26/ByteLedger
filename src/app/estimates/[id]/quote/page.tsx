// src/app/estimates/[id]/quote/page.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getOrgId } from "@/lib/org"
import { getRouteId } from "@/lib/routeParam"
import QuoteDoc from "@/app/estimates/ui/QuoteDoc"
import QuoteActions from "@/app/estimates/quote/QuoteActions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EstimateQuotePage({ params }: { params: any }) {
  const estimateId = await getRouteId(params)
  const orgId = await getOrgId()

  if (!estimateId) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-zinc-200">
          <div className="font-semibold">Quote not available</div>
          <div className="mt-2 text-sm text-zinc-400">Missing estimate id in route params.</div>
          <div className="mt-4">
            <Link href="/estimates" className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm hover:bg-zinc-900/40">
              Back to Estimates
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      organization: true,
      customer: true,
      items: { orderBy: { createdAt: "asc" } },
      sale: { select: { id: true } },
    },
  })

  if (!estimate) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-zinc-200">
          <div className="font-semibold">Quote not available</div>
          <div className="mt-2 text-sm text-zinc-400">Estimate not found.</div>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
            Debug: estimateId = <span className="font-mono text-zinc-300">{estimateId}</span><br/>
            Debug: orgId = <span className="font-mono text-zinc-300">{orgId}</span>
          </div>
          <div className="mt-4">
            <Link href="/estimates" className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm hover:bg-zinc-900/40">
              Back to Estimates
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Si estás en multi-org y quieres bloquear cross-org, aquí es donde lo harías.
  // Por ahora seguimos el patrón de "MVP tolerante".
  const saleId = estimate.sale?.id ?? estimate.saleId ?? null

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Quote</h1>
          <div className="mt-1 text-sm text-zinc-500">#{estimate.id.slice(0, 8)}</div>
        </div>

        {/* ✅ Actions ALWAYS (even if converted) */}
        <QuoteActions
          estimateId={estimate.id}
          estimateTitle={estimate.title}
          publicToken={estimate.publicToken ?? null}
          saleId={saleId}
          defaultTo={estimate.customer?.email ?? null}
        />
      </div>

      {/* ✅ Banner when converted, but don't block actions */}
      {saleId ? (
        <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-4 text-amber-100">
          <div className="font-semibold">Converted to Invoice</div>
          <div className="mt-1 text-sm text-amber-200/80">
            Este estimate ya fue convertido. Puedes reenviar, pero el sistema enviará la <b>Invoice</b>.
          </div>
          <div className="mt-3">
            <Link
              href={`/sales/${saleId}`}
              className="inline-flex rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-400"
            >
              View Invoice
            </Link>
          </div>
        </div>
      ) : null}

      {/* Quote document */}
      <QuoteDoc estimate={estimate as any} />

      <div className="flex justify-between pt-2">
        <Link href="/estimates" className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40">
          Back to Estimates
        </Link>
        {!saleId ? (
          <Link href={`/estimates/${estimate.id}/edit`} className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40">
            Edit
          </Link>
        ) : null}
      </div>
    </div>
  )
}