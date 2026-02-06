"use client"

import { usePathname } from "next/navigation"
import AppShell from "@/components/app-shell/AppShell"

function isStandalone(pathname: string) {
  const routes = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/set-password",
    "/bootstrap",
  ]
  if (routes.includes(pathname)) return true
  if (pathname.startsWith("/public")) return true
  if (pathname.startsWith("/i/")) return true
  if (pathname.startsWith("/q/")) return true
  if (pathname.startsWith("/auth")) return true
  return false
}

export default function RouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/"
  const standalone = isStandalone(pathname)

  if (standalone) {
    return (
      <div className="relative min-h-screen bg-slate-50 text-slate-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_-10%,rgba(14,165,233,0.16),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_90%_10%,rgba(16,185,129,0.14),transparent_55%)]" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-500">
          Powered by <span className="font-semibold text-slate-700">Byte Networks</span>
        </footer>
      </div>
    )
  }

  return <AppShell>{children}</AppShell>
}
