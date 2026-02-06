"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { NAV_GROUPS } from "./nav"

function isActive(pathname: string, href: string) {
  const baseHref = href.split("#")[0]?.split("?")[0] || href
  if (baseHref === "/") return pathname === "/"
  return pathname === baseHref || pathname.startsWith(baseHref + "/")
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setIsSuperAdmin(Boolean(data?.user?.isSuperAdmin))
      })
      .catch(() => {
        if (!active) return
        setIsSuperAdmin(false)
      })
    return () => {
      active = false
    }
  }, [])

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.requiresSuperAdmin ? Boolean(isSuperAdmin) : true
      ),
    })).filter((group) => group.items.length > 0)
  }, [isSuperAdmin])

  const activeGroupLabel = useMemo(() => {
    for (const group of visibleGroups) {
      for (const item of group.items) {
        if (isActive(pathname || "/", item.href)) return group.label
      }
    }
    return visibleGroups[0]?.label ?? ""
  }, [pathname, visibleGroups])
  const [openGroup, setOpenGroup] = useState(activeGroupLabel)

  useEffect(() => {
    if (activeGroupLabel) setOpenGroup(activeGroupLabel)
  }, [activeGroupLabel])

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur lg:block">
      <div className="flex h-full flex-col p-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Byte Networks</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">ByteLedger</div>
          <div className="mt-1 text-xs text-slate-500">billing • estimates • payments</div>
        </div>

        <nav className="mt-6 flex-1 space-y-5">
          {visibleGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <button
                type="button"
                onClick={() => setOpenGroup(group.label)}
                className="flex w-full items-center justify-between px-2 text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600"
              >
                <span>{group.label}</span>
                <span className="text-xs">{openGroup === group.label ? "–" : "+"}</span>
              </button>

              <div
                className={[
                  "grid gap-1 overflow-hidden transition-all duration-300",
                  openGroup === group.label ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
                ].join(" ")}
              >
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                        active
                          ? "border border-teal-200 bg-teal-50 text-teal-800"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      ].join(" ")}
                    >
                      <span className="font-medium">{item.label}</span>
                      {active ? <span className="text-xs text-teal-500">●</span> : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Workspace</div>
          <div className="mt-2 text-sm font-semibold text-slate-700">Byte Networks</div>
          <div className="mt-1 text-xs text-slate-500">Premium finance suite</div>
        </div>
      </div>
    </aside>
  )
}
