import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"
import TopNav from "@/components/app-shell/TopNav"

export const metadata: Metadata = {
  title: "ByteLedger | Byte Networks",
  description: "Track customers, catalog, sales and payments. Built by Byte Networks.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden w-64 border-r border-zinc-800 bg-zinc-950/60 p-5 md:block">
            <div className="mb-8">
              <div className="text-lg font-semibold tracking-tight">ByteLedger</div>
              <div className="text-xs text-zinc-400">by Byte Networks</div>
            </div>

            <nav className="space-y-2 text-sm">
              <NavItem href="/" label="Dashboard" />
              <NavItem href="/customers" label="Customers" />
              <NavItem href="/products" label="Catalog" />
              <NavItem href="/estimates" label="Estimates" />
              <NavItem href="/sales" label="Sales" />
              <NavItem href="/payments" label="Payments" />
              <NavItem href="/settings/organization" label="Settings" />
            </nav>

            <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="text-xs text-zinc-400">Status</div>
              <div className="mt-1 text-sm font-medium">Demo Mode</div>
              <div className="mt-2 text-xs text-zinc-500">
                Multi-tenant ready. Admin panel will manage organizations & users.
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1">
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-200">
                    ByteLedger <span className="text-zinc-500">by Byte Networks</span>
                  </div>
                  <div className="mt-2">
                    <TopNav />
                  </div>
                </div>

                <div className="text-xs text-zinc-500">v0.1</div>
              </div>
            </header>

            <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-100"
    >
      {label}
    </Link>
  )
}