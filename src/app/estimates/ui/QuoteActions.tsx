"use client"

import { useEffect, useMemo, useState } from "react"

function useSuggestedPdfName(title: string) {
  return useMemo(() => {
    const safe = (title || "quote")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    return `${safe || "quote"}.pdf`
  }, [title])
}

export default function QuoteActions({
  estimateId,
  title,
  canSend,
  defaultTo,
  canConvert = true,
}: {
  estimateId: string
  title: string
  canSend: boolean
  defaultTo?: string | null
  canConvert?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [converting, setConverting] = useState(false)

  const [showSend, setShowSend] = useState(false)
  const [to, setTo] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string>("")

  const suggestedName = useSuggestedPdfName(title)

  useEffect(() => {
    if (!showSend) return
    const d = (defaultTo || "").trim()
    setTo((prev) => (prev.trim().length > 0 ? prev : d))
  }, [defaultTo, showSend])

  function doPrint() {
    setOpen(false)
    window.print()
  }

  function doDownloadPdf() {
    setOpen(false)
    window.print()
  }

  function openSendModal() {
    setOpen(false)
    setError("")
    setNote("")
    setTo((defaultTo || "").trim())
    setShowSend(true)
  }

  async function submitSend() {
    const email = to.trim()
    if (!email) {
      setError("Customer email is empty. Please enter an email.")
      return
    }

    try {
      setSending(true)
      setError("")

      const res = await fetch(`/api/estimates/${estimateId}/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: email, note: note.trim() }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || "Send failed")
        return
      }

      setShowSend(false)
      alert("Sent ✅")
    } catch (e: any) {
      setError(e?.message || "Send failed")
    } finally {
      setSending(false)
    }
  }

  async function doConvert() {
    if (!confirm("Convert this estimate to an invoice?")) return

    try {
      setConverting(true)
      setOpen(false)

      // 🔧 si tu ruta real es distinta, cambia aquí:
      const res = await fetch(`/api/estimates/${estimateId}/convert`, {
        method: "POST",
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        alert(data?.error || "Convert failed")
        return
      }

      // Si el endpoint devuelve saleId, redirigimos:
      const saleId = data?.saleId || data?.sale?.id
      if (saleId) {
        window.location.href = `/sales/${saleId}`
      } else {
        // fallback: recarga
        window.location.reload()
      }
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
      >
        Actions
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
          <button
            onClick={doPrint}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-900/50"
          >
            Print
          </button>

          <button
            onClick={doDownloadPdf}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-900/50"
            title={`This opens print. Choose “Save as PDF” and name it ${suggestedName}.`}
          >
            Download PDF
          </button>

          {canConvert && (
            <>
              <div className="h-px bg-zinc-800" />
              <button
                onClick={doConvert}
                disabled={converting}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-900/50 disabled:opacity-50"
              >
                {converting ? "Converting..." : "Convert to Invoice"}
              </button>
            </>
          )}

          <div className="h-px bg-zinc-800" />

          <button
            onClick={openSendModal}
            disabled={!canSend}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-900/50 disabled:opacity-50"
          >
            Send email
          </button>
        </div>
      )}

      {showSend && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => !sending && setShowSend(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Send Estimate</div>
                <div className="mt-1 text-sm text-zinc-400">
                  We’ll send a PDF attachment. Replies go to your org email (Reply-To).
                </div>
              </div>

              <button
                onClick={() => !sending && setShowSend(false)}
                className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-sm hover:bg-zinc-900/40"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400">To</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="customer@email.com"
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
                <div className="mt-1 text-xs text-zinc-500">
                  Pre-filled from customer record. Editable “just in case”.
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400">Notes (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Any note you want to include..."
                  className="mt-1 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => !sending && setShowSend(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm hover:bg-zinc-900/40"
                  disabled={sending}
                >
                  Cancel
                </button>

                <button
                  onClick={submitSend}
                  className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-500 disabled:opacity-60"
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}