import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"
import CustomersClient from "./ui/CustomersClient"
import NewCustomerForm from "./ui/NewCustomerForm"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    orderBy: { createdAt: "desc" },
  })

  const clean = customers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    homeAddress: c.homeAddress,
    workAddress: c.workAddress,
    reference: c.reference,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Contact info + addresses. Notes quedan dentro del edit, no ensuciando el listado.
          </p>
        </div>

        <NewCustomerForm />
      </div>

      <CustomersClient initialCustomers={clean} />
    </div>
  )
}