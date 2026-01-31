import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="flex">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <main className="mx-auto max-w-6xl p-4 md:p-6">
            {/* fondo “Byte Networks vibe” */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              {children}
            </div>

            <div className="mx-auto mt-6 max-w-6xl px-1 text-xs text-zinc-500">
              Powered by <span className="font-semibold text-zinc-300">Byte Networks</span>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}