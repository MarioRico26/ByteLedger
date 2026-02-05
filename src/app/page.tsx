import Link from "next/link"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  const Card = ({ href, title, desc }: { href: string; title: string; desc: string }) => (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 hover:bg-zinc-900/30 transition"
    >
      <div className="text-lg font-semibold text-zinc-100">{title}</div>
      <div className="mt-1 text-sm text-zinc-500">{desc}</div>
    </Link>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
        <div className="mt-1 text-sm text-zinc-500">Quick access to your modules.</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card href="/customers" title="Customers" desc="Manage customer profiles." />
        <Card href="/products" title="Catalog" desc="Products & services pricing." />
        <Card href="/estimates" title="Estimates" desc="Create quotes and send to clients." />
        <Card href="/sales" title="Sales" desc="Invoices and payments tracking." />
        <Card href="/payments" title="Payments" desc="Log and reconcile payments." />
        <Card href="/settings/organization" title="Settings" desc="Organization profile." />
      </div>
    </div>
  )
}