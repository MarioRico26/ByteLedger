import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import { getRouteId } from "@/lib/routeParam"
import EstimateFormClient from "@/app/estimates/ui/EstimateFormClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

function priceToNumber(v: any): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v === "object" && typeof v.toString === "function") v = v.toString()
  if (typeof v === "string") {
    const s = v.trim().replace(/[$,\s]/g, "").replace(/[^\d.-]/g, "")
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default async function EditEstimatePage({ params }: { params: any }) {
  const estimateId = await getRouteId(params)

  if (!estimateId) {
    redirect("/estimates")
  }

  const orgId = await requireOrgId()

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, organizationId: orgId },
    include: { items: { orderBy: { createdAt: "asc" } }, sale: { select: { id: true } } },
  })

  if (!estimate) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-zinc-200">
        <div className="font-semibold">Edit Estimate</div>
        <div className="mt-2 text-sm text-zinc-400">Estimate not found.</div>
        <div className="mt-4">
          <Link
            href="/estimates"
            className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm hover:bg-zinc-900/40"
          >
            Back to Estimates
          </Link>
        </div>
      </div>
    )
  }

  if (estimate.sale?.id) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-zinc-200">
        <div className="font-semibold">Edit Estimate</div>
        <div className="mt-2 text-sm text-zinc-400">
          Este estimate ya fue convertido a invoice. Editar aquí rompería consistencia.
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/sales/${estimate.sale.id}`}
            className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-500"
          >
            View Invoice
          </Link>
          <Link
            href={`/estimates/${estimate.id}/quote`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm hover:bg-zinc-900/40"
          >
            Back to Quote
          </Link>
        </div>
      </div>
    )
  }

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: estimate.organizationId },
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true, phone: true },
    }),
    prisma.product.findMany({
      where: { organizationId: estimate.organizationId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, price: true },
    }),
  ])

  const cleanProducts = products.map((p: (typeof products)[number]) => ({
    ...p,
    price: priceToNumber(p.price),
  }))

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Edit Estimate</h1>
          <div className="mt-1 text-sm text-zinc-500">#{estimate.id.slice(0, 8)}</div>
        </div>

        <Link
          href={`/estimates/${estimate.id}/quote`}
          className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
        >
          View Quote
        </Link>
      </div>

      <EstimateFormClient
        mode="edit"
        estimate={estimate as any}
        customers={customers}
        products={cleanProducts as any}
      />
    </div>
  )
}
