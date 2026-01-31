// byteledger/src/app/products/page.tsx
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import ProductsClient from "./ui/ProductsClient"

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      price: true,
      active: true,
      createdAt: true,
    },
  })

  const clean = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    type: p.type, // "PRODUCT" | "SERVICE"
    price: p.price ? Number(p.price) : null,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  }))

  return <ProductsClient initialProducts={clean} />
}