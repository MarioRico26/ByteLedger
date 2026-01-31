"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export type SearchableOption = {
  value: string
  label: string
  subLabel?: string
}

type Props = {
  value: string
  onChange: (value: string) => void
  options: SearchableOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Simple searchable dropdown (combobox).
 * - Keeps `value` as the selected option value
 * - Displays option.label in the input
 * - Filters as you type
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const blurTimer = useRef<any>(null)

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  )

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  // Sync displayed text when external value changes
  useEffect(() => {
    setQuery(selected?.label ?? "")
  }, [selected?.label])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!open) return options
    if (!q) return options
    return options.filter((o) => {
      const hay = `${o.label} ${o.subLabel ?? ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [options, query, open])

  function choose(opt: SearchableOption) {
    onChange(opt.value)
    setOpen(false)
    setActiveIndex(0)
    // Ensure input shows label (in case same value)
    setQuery(opt.label)
    // keep focus nice
    requestAnimationFrame(() => inputRef.current?.blur())
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true)
      return
    }

    if (!open) return

    if (e.key === "Escape") {
      setOpen(false)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }

    if (e.key === "Enter") {
      e.preventDefault()
      const opt = filtered[activeIndex]
      if (opt) choose(opt)
      return
    }
  }

  function onFocus() {
    if (disabled) return
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setOpen(true)
  }

  function onBlur() {
    // allow click on menu items before closing
    blurTimer.current = setTimeout(() => {
      setOpen(false)
      setActiveIndex(0)
      // If user typed random text, snap back to selected label
      setQuery(selected?.label ?? "")
    }, 120)
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        ref={inputRef}
        value={open ? query : (selected?.label ?? query)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-600 disabled:opacity-60"
      />

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
          <div className="max-h-60 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                No results
              </div>
            ) : (
              filtered.map((opt, idx) => {
                const active = idx === activeIndex
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(opt)}
                    className={`w-full px-3 py-2 text-left text-sm ${
                      active ? "bg-zinc-900/60" : "bg-transparent"
                    } hover:bg-zinc-900/60`}
                  >
                    <div className="text-zinc-100">{opt.label}</div>
                    {opt.subLabel ? (
                      <div className="text-xs text-zinc-500">{opt.subLabel}</div>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}