import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import QuoteDoc from "@/app/estimates/ui/QuoteDoc"
import QuoteActions from "./QuoteActions"

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const estimate = await prisma.estimate.findFirst({
    where: { id, organizationId: DEFAULT_ORG_ID },
    include: {
      customer: true,
      organization: true,
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

  return (
    <div className="space-y-4">
      <div className="sticky top-[72px] z-10 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 backdrop-blur">
        <QuoteActions
          estimateId={estimate.id}
          saleId={estimate.saleId}
          status={estimate.status}
          defaultEmail={estimate.customer.email}
        />
      </div>

      <QuoteDoc
        mode="internal"
        estimate={{
          id: estimate.id,
          title: estimate.title,
          status: estimate.status,
          createdAt: estimate.createdAt,
          subtotalAmount: estimate.subtotalAmount,
          discountAmount: estimate.discountAmount,
          taxRate: estimate.taxRate,
          taxAmount: estimate.taxAmount,
          totalAmount: estimate.totalAmount,
          notes: estimate.notes,
          saleId: estimate.saleId,
          publicToken: estimate.publicToken,
        }}
        organization={estimate.organization}
        customer={estimate.customer}
        items={estimate.items.map((it) => ({
          id: it.id,
          name: it.name,
          type: it.type,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineTotal: it.lineTotal,
        }))}
      />
    </div>
  )
}
