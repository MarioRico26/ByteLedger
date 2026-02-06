"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import MobileMenu from "./MobileMenu"

export default function Topbar() {
  const router = useRouter()

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 shadow-[0_6px_20px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <MobileMenu />
          <button
            onClick={() => router.back()}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            ← Back
          </button>

          <Link
            href="/"
            className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 sm:inline-flex"
          >
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="hidden text-[11px] uppercase tracking-[0.28em] text-slate-400 md:block">
            ByteLedger
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
