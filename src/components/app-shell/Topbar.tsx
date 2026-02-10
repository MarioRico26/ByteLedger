"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import MobileMenu from "./MobileMenu"

export default function Topbar() {
  const router = useRouter()
  const [profile, setProfile] = useState<{
    name?: string | null
    email?: string | null
    organizationName?: string | null
  } | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setProfile(data?.user || null)
      })
      .catch(() => {
        if (!active) return
        setProfile(null)
      })
    return () => {
      active = false
    }
  }, [])

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_8px_22px_rgba(15,23,42,0.08)] backdrop-blur">
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
          <div className="hidden text-right md:block">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
              {profile?.organizationName || "ByteLedger"}
            </div>
            <div className="text-[11px] text-slate-500">
              {profile?.name || profile?.email || ""}
            </div>
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
