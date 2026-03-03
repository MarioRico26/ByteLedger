import { PrismaClient } from "@prisma/client"

type Args = {
  orgName?: string
  orgId?: string
  apply: boolean
  yes: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { apply: false, yes: false }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === "--apply") args.apply = true
    else if (a === "--yes") args.yes = true
    else if (a === "--org-name") args.orgName = argv[i + 1]
    else if (a === "--org-id") args.orgId = argv[i + 1]
  }
  return args
}

async function main() {
  const prisma = new PrismaClient()
  const args = parseArgs(process.argv.slice(2))

  if (!args.orgName && !args.orgId) {
    throw new Error("Use --org-name \"Byte Networks\" or --org-id <id>")
  }

  const where = args.orgId
    ? { id: args.orgId }
    : {
        OR: [
          { name: { equals: args.orgName, mode: "insensitive" as const } },
          { businessName: { equals: args.orgName, mode: "insensitive" as const } },
        ],
      }

  const matches = await prisma.organization.findMany({
    where,
    select: { id: true, name: true, businessName: true },
  })

  if (matches.length === 0) {
    throw new Error("No organization matched the provided filter.")
  }
  if (matches.length > 1 && !args.orgId) {
    throw new Error(
      `Multiple organizations matched. Re-run with --org-id. Matches: ${matches
        .map((o) => `${o.id} (${o.businessName || o.name})`)
        .join(", ")}`
    )
  }

  const org = matches[0]
  const orgId = org.id

  const [
    customers,
    products,
    estimates,
    estimateItems,
    sales,
    saleItems,
    payments,
    emailLogs,
  ] = await Promise.all([
    prisma.customer.count({ where: { organizationId: orgId } }),
    prisma.product.count({ where: { organizationId: orgId } }),
    prisma.estimate.count({ where: { organizationId: orgId } }),
    prisma.estimateItem.count({ where: { organizationId: orgId } }),
    prisma.sale.count({ where: { organizationId: orgId } }),
    prisma.saleItem.count({ where: { organizationId: orgId } }),
    prisma.payment.count({ where: { organizationId: orgId } }),
    prisma.emailLog.count({ where: { organizationId: orgId } }),
  ])

  console.log("Organization selected:")
  console.log(`- id: ${org.id}`)
  console.log(`- name: ${org.businessName || org.name}`)
  console.log("")
  console.log("Operational rows to remove:")
  console.log(`- customers: ${customers}`)
  console.log(`- products: ${products}`)
  console.log(`- estimates: ${estimates}`)
  console.log(`- estimateItems: ${estimateItems}`)
  console.log(`- sales: ${sales}`)
  console.log(`- saleItems: ${saleItems}`)
  console.log(`- payments: ${payments}`)
  console.log(`- emailLogs: ${emailLogs}`)

  if (!args.apply) {
    console.log("")
    console.log("Preview only. No data deleted.")
    console.log("Run again with --apply --yes to execute.")
    await prisma.$disconnect()
    return
  }

  if (!args.yes) {
    throw new Error("Safety check failed. Re-run with --apply --yes to confirm deletion.")
  }

  const result = await prisma.$transaction(async (tx) => {
    const deletedEmailLogs = await tx.emailLog.deleteMany({ where: { organizationId: orgId } })
    const deletedPayments = await tx.payment.deleteMany({ where: { organizationId: orgId } })
    const deletedSaleItems = await tx.saleItem.deleteMany({ where: { organizationId: orgId } })
    const deletedEstimateItems = await tx.estimateItem.deleteMany({
      where: { organizationId: orgId },
    })
    const deletedEstimates = await tx.estimate.deleteMany({ where: { organizationId: orgId } })
    const deletedSales = await tx.sale.deleteMany({ where: { organizationId: orgId } })
    const deletedCustomers = await tx.customer.deleteMany({ where: { organizationId: orgId } })
    const deletedProducts = await tx.product.deleteMany({ where: { organizationId: orgId } })

    return {
      deletedEmailLogs: deletedEmailLogs.count,
      deletedPayments: deletedPayments.count,
      deletedSaleItems: deletedSaleItems.count,
      deletedEstimateItems: deletedEstimateItems.count,
      deletedEstimates: deletedEstimates.count,
      deletedSales: deletedSales.count,
      deletedCustomers: deletedCustomers.count,
      deletedProducts: deletedProducts.count,
    }
  })

  console.log("")
  console.log("Deletion completed:")
  console.log(result)

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error("Error:", err?.message || err)
  process.exit(1)
})
