"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { NAV_GROUPS } from "./nav"

function isActive(pathname: string, href: string) {
  const baseHref = href.split("#")[0]?.split("?")[0] || href
  if (baseHref === "/") return pathname === "/"
  return pathname === baseHref || pathname.startsWith(baseHref + "/")
}

export default function MobileMenu() {
  const pathname = usePathname() || "/"
  const [open, setOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.dataset.mobileMenu = "open"
      document.body.style.overflow = "hidden"
    } else {
      delete document.body.dataset.mobileMenu
      document.body.style.overflow = ""
    }
    return () => {
      delete document.body.dataset.mobileMenu
      document.body.style.overflow = ""
    }
  }, [open])

  const groups = useMemo(() => {
    return NAV_GROUPS.map((group: any) => ({
      ...group,
      items: group.items.filter((item: any) =>
        item.requiresSuperAdmin ? Boolean(isSuperAdmin) : true
      ),
    })).filter((group: any) => group.items.length > 0)
  }, [isSuperAdmin])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 lg:hidden"
      >
        Menu
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[2147483647] isolate lg:hidden"
              role="dialog"
              aria-modal="true"
            >
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="absolute inset-0 modal-overlay"
              />
              <div className="absolute inset-0 h-full w-full overflow-y-auto bg-white p-5 shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                      Byte Networks
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">ByteLedger</div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 space-y-5 pb-8">
                  {groups.map((group: any) => (
                    <div key={group.label} className="space-y-2">
                      <div className="px-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        {group.label}
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item: any) => {
                          const active = isActive(pathname, item.href)
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={[
                                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition",
                                active
                                  ? "border border-blue-200 bg-blue-50 text-blue-900"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                              ].join(" ")}
                            >
                              <span className="font-medium">{item.label}</span>
                              {active ? <span className="text-xs text-amber-500">●</span> : null}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
