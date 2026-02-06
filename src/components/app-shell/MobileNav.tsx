"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const MOBILE_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Estimates", href: "/estimates" },
  { label: "Sales", href: "/sales" },
  { label: "Payments", href: "/payments" },
  { label: "Reports", href: "/reports" },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

export default function MobileNav() {
  const pathname = usePathname() || "/"

  return (
    <nav
      id="mobile-nav"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/70 bg-white/92 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {MOBILE_ITEMS.map((item: any) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold",
                active ? "text-teal-700" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-teal-500" : "bg-slate-300"}`} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
