// src/lib/appUrl.ts
export function getBaseUrl(req?: Request) {
  // 1) Prefer explicit env (works local + prod)
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL

  if (explicit) return explicit.replace(/\/$/, "")

  // 2) If request is available (Route Handlers), infer from headers
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "http"
    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host")

    if (host) return `${proto}://${host}`.replace(/\/$/, "")
  }

  // 3) Vercel fallback
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "")
  }

  // 4) Local fallback
  return "http://localhost:3000"
}