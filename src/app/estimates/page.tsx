import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getOrgId } from "@/lib/org"
import EstimatesTableClient, { type EstimateRow } from "@/app/estimates/ui/EstimatesTableClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

function decToString(v: any) {
  if (v === null || v === undefined) return "0"
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  if (typeof v === "object" && typeof v.toString === "function") return v.toString()
  return String(v)
}

export default async function EstimatesPage() {
  const orgId = await getOrgId()

  const estimates = await prisma.estimate.findMany({
    where: { organizationId: orgId },
    include: {
      customer: { select: { id: true, fullName: true, email: true, phone: true } },
      sale: { select: { id: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const rows: EstimateRow[] = estimates.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    saleId: e.saleId ?? null,
    totalAmount: decToString(e.totalAmount),
    subtotalAmount: decToString(e.subtotalAmount),
    taxRate: decToString(e.taxRate),
    taxAmount: decToString(e.taxAmount),
    discountAmount: decToString(e.discountAmount),
    itemsCount: e._count.items,
    customer: e.customer
      ? {
          id: e.customer.id,
          fullName: e.customer.fullName,
          email: e.customer.email ?? null,
          phone: e.customer.phone ?? null,
        }
      : null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estimates</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Quotes you can send, print, and convert into invoices.
          </p>
        </div>

        <Link
          href="/estimates/new"
          className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
        >
          + New Estimate
        </Link>
      </div>

      <EstimatesTableClient initialEstimates={rows} />
    </div>
  )
}