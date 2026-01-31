import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.organization.upsert({
    where: { id: "org_demo_byteledger" },
    update: {
      businessName: "Byte Networks",
      email: "info@bytenetworks.net",
      phone: "+1 (609) 713-3333",
      website: "bytenetworks.net",
      addressLine1: "New Jersey, USA",
      city: "Manahawkin",
      state: "NJ",
      zip: "08050",
      country: "United States",
    },
    create: {
      id: "org_demo_byteledger",
      name: "Demo Organization (ByteLedger)",
      businessName: "Byte Networks",
      email: "info@bytenetworks.net",
      phone: "+1 (732) 000-0000",
      website: "bytenetworks.net",
      addressLine1: "New Jersey, USA",
      city: "Manahawkin",
      state: "NJ",
      zip: "08050",
      country: "United States",
    },
  })

  console.log("✅ Seed complete: org_demo_byteledger updated with billing profile")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })