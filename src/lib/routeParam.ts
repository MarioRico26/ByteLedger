import "server-only"

export async function getRouteId(params: any): Promise<string> {
  const p = await Promise.resolve(params)
  if (!p) return ""

  if (typeof p.id === "string") return p.id.trim()

  const first = Object.values(p)[0]
  return typeof first === "string" ? first.trim() : ""
}