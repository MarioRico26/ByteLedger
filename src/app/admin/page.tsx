import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminClient from "./ui/AdminClient"

export default async function AdminPage() {
  const session = await getSession()
  if (session?.user?.mustChangePassword) {
    redirect("/set-password")
  }
  if (!session || !session.user?.isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Not authorized</div>
        <div className="mt-2 text-sm text-slate-500">
          You do not have permission to access the admin panel.
        </div>
      </div>
    )
  }

  const [orgs, users] = await Promise.all([
    prisma.organization.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { memberships: { include: { organization: true } } },
    }),
  ])

  const benchmarks = await Promise.all(
    orgs.map(async (org) => {
      const [
        customersCount,
        productsCount,
        estimatesCount,
        salesCount,
        paymentsCount,
        salesAgg,
        paymentsAgg,
      ] = await Promise.all([
        prisma.customer.count({ where: { organizationId: org.id } }),
        prisma.product.count({ where: { organizationId: org.id } }),
        prisma.estimate.count({ where: { organizationId: org.id } }),
        prisma.sale.count({ where: { organizationId: org.id } }),
        prisma.payment.count({ where: { organizationId: org.id } }),
        prisma.sale.aggregate({
          where: { organizationId: org.id },
          _sum: { totalAmount: true, balanceAmount: true },
        }),
        prisma.payment.aggregate({
          where: { organizationId: org.id },
          _sum: { amount: true },
        }),
      ])

      return {
        organizationId: org.id,
        organizationName: org.businessName || org.name,
        customersCount,
        productsCount,
        estimatesCount,
        salesCount,
        paymentsCount,
        totalInvoiced: salesAgg._sum.totalAmount?.toString() ?? "0",
        totalCollected: paymentsAgg._sum.amount?.toString() ?? "0",
        outstanding: salesAgg._sum.balanceAmount?.toString() ?? "0",
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Superadmin
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Admin Console
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create organizations and users. Logged in as {session.user.email}.
          </p>
        </div>
      </div>

      <AdminClient orgs={orgs as any} users={users as any} benchmarks={benchmarks as any} />
    </div>
  )
}
