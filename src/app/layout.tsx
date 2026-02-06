// src/app/layout.tsx
import "./globals.css"
import { Manrope, Space_Grotesk } from "next/font/google"
import RouteShell from "@/components/RouteShell"

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

export const metadata = {
  title: "ByteLedger",
  description: "ByteLedger",
  applicationName: "ByteLedger",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    title: "ByteLedger",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable} min-h-screen antialiased`}>
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  )
}
