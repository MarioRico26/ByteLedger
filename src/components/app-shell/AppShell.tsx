"use client"

import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import MobileNav from "./MobileNav"

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell-bg relative min-h-screen text-slate-900 print:bg-white">
      <div className="pointer-events-none absolute inset-0 app-shell-grid print:hidden" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_15%_-10%,rgba(14,165,233,0.18),transparent_60%)] print:hidden" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_90%_10%,rgba(16,185,129,0.16),transparent_60%)] print:hidden" />

      <div className="relative z-10 flex">
        <div className="print:hidden">
          <Sidebar />
        </div>

        <div className="min-w-0 flex-1">
          <div className="print:hidden">
            <Topbar />
          </div>

          <main className="mx-auto max-w-6xl p-4 pb-24 md:p-6 md:pb-6 print:p-0">
            <div className="app-panel app-panel-strong relative rounded-3xl p-4 md:p-6 print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none">
              <div className="pointer-events-none absolute left-6 right-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-teal-400 via-sky-400 to-emerald-400 opacity-80 print:hidden" />
              <div className="relative">{children}</div>
            </div>

            <div className="mx-auto mt-6 max-w-6xl px-1 text-xs text-slate-500 print:hidden">
              Powered by <span className="font-semibold text-slate-700">Byte Networks</span>
            </div>
          </main>
        </div>
      </div>

      <div className="print:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
