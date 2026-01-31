"use client"

import { useMemo, useRef, useState } from "react"

type Option = {
  value: string
  label: string
  hint?: string
}

export default function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
  className = "",
}: {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const rootRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  )

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return options
    return options.filter((o) => {
      const hay = `${o.label} ${o.hint || ""}`.toLowerCase()
      return hay.includes(query)
    })
  }, [options, q])

  function close() {
    setOpen(false)
    setQ("")
  }

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onBlur={(e) => {
        // close when focus leaves the component
        if (!rootRef.current) return
        if (!rootRef.current.contains(e.relatedTarget as Node)) close()
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-left text-sm text-zinc-100",
          "focus:outline-none focus:ring-2 focus:ring-zinc-300",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-zinc-900/60",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {selected ? (
              <div className="truncate">
                {selected.label}
                {selected.hint ? (
                  <span className="ml-2 text-xs text-zinc-500">{selected.hint}</span>
                ) : null}
              </div>
            ) : (
              <div className="text-zinc-500">{placeholder}</div>
            )}
          </div>

          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="shrink-0 text-zinc-500"
          >
            <path
              d="M6 8l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
          <div className="p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to search..."
              className="w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-2 pt-0">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-500">
                No matches.
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                    onClick={() => {
                      onChange(o.value)
                      close()
                    }}
                    className={[
                      "w-full rounded-xl px-3 py-2 text-left text-sm",
                      o.value === value
                        ? "bg-zinc-900/60 text-zinc-100"
                        : "hover:bg-zinc-900/40 text-zinc-200",
                    ].join(" ")}
                  >
                    <div className="truncate">{o.label}</div>
                    {o.hint ? (
                      <div className="truncate text-xs text-zinc-500">{o.hint}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}