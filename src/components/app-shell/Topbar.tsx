"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Topbar() {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-40 border-b border-zinc-800 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            ← Back
          </button>

          <Link
            href="/"
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
          >
            Home
          </Link>
        </div>

        <div className="text-sm text-zinc-400">
          <span className="font-semibold text-zinc-200">ByteLedger</span>
        </div>
      </div>
    </div>
  )
}