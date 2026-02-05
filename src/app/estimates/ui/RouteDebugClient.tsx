"use client"

export default function RouteDebugClient() {
  if (typeof window === "undefined") return null

  return (
    <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
      <div>
        Debug (client): pathname ={" "}
        <span className="font-mono text-zinc-200">{window.location.pathname}</span>
      </div>
      <div>
        Debug (client): href ={" "}
        <span className="font-mono text-zinc-200">{window.location.href}</span>
      </div>
    </div>
  )
}