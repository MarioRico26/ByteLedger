import { prisma } from "@/lib/prisma"
import { getOrgId } from "@/lib/org"
import EstimateFormClient from "@/app/estimates/ui/EstimateFormClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

function priceToNumber(v: any): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null

  // Prisma Decimal u otros objetos "numéricos"
  if (typeof v === "object" && typeof v.toString === "function") {
    const s = v.toString()
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  if (typeof v === "string") {
    const s = v.trim().replace(/[$,\s]/g, "").replace(/[^\d.-]/g, "")
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default async function NewEstimatePage() {
  const orgId = await getOrgId()

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true, phone: true },
    }),
    prisma.product.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, price: true },
    }),
  ])

  // ✅ CLAVE: aquí conviertes a number/null, nada de Decimal en el client
  const cleanProducts = products.map((p) => ({
    ...p,
    price: priceToNumber(p.price),
  }))

  return (
    <div className="mx-auto max-w-5xl p-6">
      <EstimateFormClient mode="create" customers={customers} products={cleanProducts as any} />
    </div>
  )
}