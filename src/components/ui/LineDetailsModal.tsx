"use client"

import { useEffect, useRef } from "react"

function autoResizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = "0px"
  el.style.height = `${Math.min(el.scrollHeight, 240)}px`
}

export default function LineDetailsModal({
  open,
  title,
  value,
  onChange,
  onClose,
}: {
  open: boolean
  title: string
  value: string
  onChange: (next: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!open) return
    const t = ref.current
    if (!t) return
    autoResizeTextarea(t)
    t.focus()
    t.setSelectionRange(t.value.length, t.value.length)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 modal-overlay">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900">Line Details</div>
            <div className="mt-1 text-sm text-slate-500">{title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Line note (optional)
          </label>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onInput={(e) => autoResizeTextarea(e.currentTarget)}
            rows={2}
            placeholder="Add scope, inclusions, exclusions, serials, conditions, etc."
            className="w-full resize-none overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-400"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
