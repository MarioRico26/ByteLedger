// byteledger/src/app/q/[token]/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import QuoteDoc from "@/app/estimates/ui/QuoteDoc"

export default async function PublicQuotePage({ params }: { params: { token: string } }) {
  const estimate = await prisma.estimate.findFirst({
    where: { publicToken: params.token },
    include: {
      organization: true,
      customer: true,
      items: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!estimate || !estimate.customer) return notFound()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 print:px-0 print:py-0">
        <QuoteDoc data={estimate as any} />
      </div>
    </div>
  )
}