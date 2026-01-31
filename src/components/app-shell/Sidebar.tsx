"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS } from "./nav"

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-zinc-800 bg-black md:block">
      <div className="p-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs uppercase tracking-widest text-zinc-500">
            Byte Networks
          </div>
          <div className="mt-1 text-lg font-semibold text-zinc-100">
            ByteLedger
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            invoices • estimates • payments
          </div>
        </div>

        <nav className="mt-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "border border-zinc-700 bg-zinc-900/40 text-white"
                    : "text-zinc-300 hover:bg-zinc-900/30 hover:text-white",
                ].join(" ")}
              >
                <span className="font-medium">{item.label}</span>
                {active ? (
                  <span className="text-xs text-zinc-400">●</span>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}