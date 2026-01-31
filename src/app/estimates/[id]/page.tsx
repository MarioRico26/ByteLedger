import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import QuoteDoc from "@/app/estimates/ui/QuoteDoc"
import QuoteActions from "./QuoteActions"

export const dynamic = "force-dynamic"

export default async function QuotePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const estimate = await prisma.estimate.findFirst({
    where: { id, organizationId: DEFAULT_ORG_ID },
    include: {
      organization: true,
      customer: true,
      items: { orderBy: { createdAt: "asc" } },
      sale: { select: { id: true } },
    },
  })

  if (!estimate) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-400">
        Quote not found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <QuoteActions
        estimateId={estimate.id}
        saleId={estimate.saleId}
        status={estimate.status}
        defaultTo={estimate.customer?.email || undefined}
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-white">
        <QuoteDoc estimate={estimate as any} organization={estimate.organization as any} customer={estimate.customer as any} items={estimate.items as any} />
      </div>
    </div>
  )
}
