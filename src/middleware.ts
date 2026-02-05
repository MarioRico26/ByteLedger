import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()

  // Si alguien generó /estimates//edit (o cualquier //), lo normalizamos.
  if (url.pathname.includes("//")) {
    url.pathname = url.pathname.replace(/\/{2,}/g, "/")
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Evita tocar assets internos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}