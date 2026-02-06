"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { NAV_GROUPS } from "./nav"

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

export default function RibbonNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500" />
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
              Byte Networks
            </div>
            <div className="text-sm font-semibold text-slate-900">ByteLedger</div>
          </div>
        </Link>

        <div className="flex flex-1 items-center gap-6 overflow-x-auto pb-1">
          {NAV_GROUPS.map((group: any) => (
            <div key={group.label} className="flex flex-col gap-2">
              <div className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
                {group.label}
              </div>
              <div className="flex items-center gap-2">
                {group.items.map((item: any) => {
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold transition",
                        active
                          ? "bg-teal-100 text-teal-800"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Back
          </button>
          <button
            onClick={logout}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
