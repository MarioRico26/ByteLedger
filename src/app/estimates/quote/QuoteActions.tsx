"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSuggestedPdfName } from "@/lib/useSuggestedPdfName"

async function postJson(url: string, body?: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error || json?.message || `Request failed: ${res.status}`
    throw new Error(msg)
  }
  return json
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

type Props = {
  estimateId: string
  estimateTitle: string
  saleId?: string | null
  defaultTo?: string | null
  editHref?: string | null
  className?: string
}

export default function QuoteActions({
  estimateId,
  estimateTitle,
  saleId,
  defaultTo,
  editHref,
  className,
}: Props) {
  const [sendOpen, setSendOpen] = useState(false)
  const [to, setTo] = useState(defaultTo || "")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const locked = Boolean(saleId)
  const pdfName = useSuggestedPdfName(estimateTitle)

  useEffect(() => {
    if (!to.trim() && defaultTo?.trim()) setTo(defaultTo.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTo])

  const canSend = isValidEmail(to.trim())

  async function onSend() {
    try {
      setSending(true)
      await postJson(`/api/estimates/${estimateId}/send`, {
        to: to.trim(),
        note: note.trim() || undefined,
        filename: pdfName, // opcional, por si quieres usarlo server-side
      })
      setToast("Sent ✅")
      setSendOpen(false)
      setNote("")
    } catch (e: any) {
      setToast(`Error: ${e.message || "Failed"}`)
    } finally {
      setSending(false)
      setTimeout(() => setToast(null), 3500)
    }
  }

  return (
    <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      {editHref ? (
        <Link
          href={editHref}
          className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
        >
          Edit
        </Link>
      ) : null}

      {/* Convert / View Invoice */}
      {!locked ? (
        <Link
          href={`/estimates/${estimateId}/convert`}
          className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-400"
        >
          Convert to Invoice
        </Link>
      ) : (
        <Link
          href={`/sales/${saleId}`}
          className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-400"
        >
          View Invoice
        </Link>
      )}

      {/* Print / Download */}
      <button
        onClick={() => window.print()}
        className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
      >
        Print
      </button>

      <a
        href={`/api/estimates/${estimateId}/pdf?filename=${encodeURIComponent(pdfName)}`}
        className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
      >
        Download PDF
      </a>

      {/* ✅ Send ALWAYS visible. If converted -> sends Invoice (backend decides) */}
      <button
        onClick={() => setSendOpen(true)}
        className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
      >
        {locked ? "Send Invoice" : "Send"}
      </button>

      {/* Modal Send */}
      {sendOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="modal-panel card-stripe w-full max-w-lg p-5 text-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {locked ? "Send Invoice (PDF Attached)" : "Send Estimate (PDF Attached)"}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Default comes from customer email. You can override it.
                </div>
              </div>
              <button
                onClick={() => setSendOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-500">To</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  placeholder="customer@email.com"
                />
                {!defaultTo?.trim() ? (
                  <div className="mt-1 text-xs text-amber-600">
                    Customer no tiene email guardado. Escribe uno para habilitar “Send”.
                  </div>
                ) : null}
                {to.trim() && !canSend ? (
                  <div className="mt-1 text-xs text-rose-500">Email inválido.</div>
                ) : null}
              </div>

              <div>
                <label className="text-xs text-slate-500">Notes (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  rows={4}
                  placeholder="Add a short message..."
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setSendOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={onSend}
                disabled={!canSend || sending}
                className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
