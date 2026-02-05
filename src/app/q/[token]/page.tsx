// src/app/q/[token]/page.tsx

import { notFound } from "next/navigation"
import QuoteDoc from "@/app/estimates/ui/QuoteDoc"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PublicQuotePage({
  params,
}: {
  params: { token: string }
}) {
  const token = String(params?.token || "").trim()
  if (!token) return notFound()

  const estimate = await prisma.estimate.findFirst({
    where: { publicToken: token },
    include: {
      organization: {
        select: {
          name: true,
          businessName: true,
          email: true,
          phone: true,
          website: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          zip: true,
          country: true,
        },
      },
      customer: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          homeAddress: true,
          workAddress: true,
        },
      },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
    },
  })

  if (!estimate) return notFound()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <QuoteDoc estimate={estimate as any} />
      </div>
    </div>
  )
}