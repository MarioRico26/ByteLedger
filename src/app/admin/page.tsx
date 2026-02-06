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

      <AdminClient orgs={orgs as any} users={users as any} />
    </div>
  )
}
