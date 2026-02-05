// src/app/layout.tsx
import "./globals.css"
import Link from "next/link"

export const metadata = {
  title: "ByteLedger",
  description: "ByteLedger",
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
          <aside className="no-print hidden w-64 border-r border-zinc-800 bg-zinc-950/60 p-5 md:block">
            <div className="text-sm font-semibold text-zinc-100">ByteLedger</div>

            <nav className="mt-6 space-y-1 text-sm">
              <Link
                href="/dashboard"
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/40 hover:text-zinc-100"
              >
                Dashboard
              </Link>
              <Link
                href="/estimates"
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/40 hover:text-zinc-100"
              >
                Estimates
              </Link>
              <Link
                href="/sales"
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/40 hover:text-zinc-100"
              >
                Sales
              </Link>
              <Link
                href="/customers"
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/40 hover:text-zinc-100"
              >
                Customers
              </Link>
              <Link
                href="/products"
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/40 hover:text-zinc-100"
              >
                Products
              </Link>
              <Link
                href="/settings"
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/40 hover:text-zinc-100"
              >
                Settings
              </Link>
            </nav>
          </aside>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Header */}
            <header className="no-print sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <div className="text-sm text-zinc-300">ByteLedger</div>
                <div className="text-xs text-zinc-500">Demo</div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}