// byteledger/src/app/estimates/[id]/quote/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import QuoteDoc from "@/app/estimates/ui/QuoteDoc"
import QuoteActions from "@/app/estimates/quote/QuoteActions"

export default async function QuotePage({ params }: { params: { id: string } }) {
  const estimate = await prisma.estimate.findFirst({
    where: { id: params.id, organizationId: DEFAULT_ORG_ID },
    include: {
      organization: true,
      customer: true,
      items: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!estimate || !estimate.customer) return notFound()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <QuoteActions
        estimateId={estimate.id}
        defaultTo={estimate.customer.email || ""}
        backHref={`/estimates/${estimate.id}`}
      />

      <div className="mx-auto max-w-4xl px-4 py-8 print:px-0 print:py-0">
        <QuoteDoc data={estimate as any} />
      </div>
    </div>
  )
}