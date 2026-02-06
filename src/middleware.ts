import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()

  const pathname = url.pathname

  // Si alguien generó /estimates//edit (o cualquier //), lo normalizamos.
  if (url.pathname.includes("//")) {
    url.pathname = url.pathname.replace(/\/{2,}/g, "/")
    return NextResponse.redirect(url)
  }

  const publicPaths = [
    "/login",
    "/bootstrap",
    "/forgot-password",
    "/reset-password",
    "/set-password",
    "/auth/verify",
    "/api/auth/request",
    "/api/auth/bootstrap",
    "/api/auth/logout",
    "/api/auth/login",
    "/api/auth/forgot",
    "/api/auth/reset",
    "/api/auth/change-password",
    "/public",
  ]

  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"

  if (isPublic) return NextResponse.next()

  const sessionId = req.cookies.get("bl_session")?.value
  if (!sessionId) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Evita tocar assets internos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
