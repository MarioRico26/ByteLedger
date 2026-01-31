"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const LABELS: Record<string, string> = {
  customers: "Customers",
  products: "Catalog",
  sales: "Sales",
  payments: "Payments",
  estimates: "Estimates",
  settings: "Settings",
  organization: "Organization",
  new: "New",
  invoice: "Invoice",
  quote: "Quote",
}

function nice(seg: string) {
  if (!seg) return ""
  if (LABELS[seg]) return LABELS[seg]
  // ids largos: los acortamos
  if (seg.length > 10) return `${seg.slice(0, 6)}…${seg.slice(-4)}`
  return seg.charAt(0).toUpperCase() + seg.slice(1)
}

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname() || "/"

  const parts = pathname.split("/").filter(Boolean)

  const crumbs = parts.map((seg, idx) => {
    const href = "/" + parts.slice(0, idx + 1).join("/")
    return { seg, href, label: nice(seg) }
  })

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.back()}
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-900/40"
        title="Back"
        type="button"
      >
        ← Back
      </button>

      <Link
        href="/"
        className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-900/40"
        title="Home"
      >
        ⌂ Home
      </Link>

      <div className="hidden items-center gap-2 text-xs text-zinc-500 md:flex">
        <span className="text-zinc-600">/</span>
        {crumbs.length === 0 ? (
          <span className="text-zinc-300">Dashboard</span>
        ) : (
          crumbs.map((c, i) => (
            <div key={c.href} className="flex items-center gap-2">
              <Link href={c.href} className="hover:text-zinc-200">
                {c.label}
              </Link>
              {i < crumbs.length - 1 ? <span className="text-zinc-700">/</span> : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}