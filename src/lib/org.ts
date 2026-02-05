import "server-only"
import { prisma } from "@/lib/prisma"

/**
 * MVP: si solo tienes 1 org, usamos esa.
 * Si no existe, la creamos.
 */
export async function getOrgId(): Promise<string> {
  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  if (org?.id) return org.id

  const created = await prisma.organization.create({
    data: { name: "ByteLedger" },
    select: { id: true },
  })

  return created.id
}