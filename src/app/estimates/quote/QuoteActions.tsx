"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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
  publicToken: string | null
  saleId?: string | null
  defaultTo?: string | null
}

export default function QuoteActions({
  estimateId,
  estimateTitle,
  publicToken,
  saleId,
  defaultTo,
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

  const quoteHref = useMemo(() => {
    return publicToken ? `/q/${publicToken}` : `/estimates/${estimateId}/quote`
  }, [publicToken, estimateId])

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
    <div className="flex flex-wrap gap-2">
      {/* Convert / View Invoice */}
      {!locked ? (
        <Link
          href={`/estimates/${estimateId}/convert`}
          className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-500"
        >
          Convert to Invoice
        </Link>
      ) : (
        <Link
          href={`/sales/${saleId}`}
          className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-500"
        >
          View Invoice
        </Link>
      )}

      {/* Print / Download */}
      <button
        onClick={() => window.print()}
        className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
      >
        Print
      </button>

      <a
        href={`/api/estimates/${estimateId}/pdf?filename=${encodeURIComponent(pdfName)}`}
        className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
      >
        Download PDF
      </a>

      {/* ✅ Send ALWAYS visible. If converted -> sends Invoice (backend decides) */}
      <button
        onClick={() => setSendOpen(true)}
        className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
      >
        {locked ? "Send Invoice" : "Send"}
      </button>

      {/* View Quote */}
      <Link
        href={quoteHref}
        className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900/40"
      >
        View Quote
      </Link>

      {/* Modal Send */}
      {sendOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-zinc-100">
                  {locked ? "Send Invoice (PDF Attached)" : "Send Estimate (PDF Attached)"}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  Default comes from customer email. You can override it.
                </div>
              </div>
              <button
                onClick={() => setSendOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900/40"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-500">To</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  placeholder="customer@email.com"
                />
                {!defaultTo?.trim() ? (
                  <div className="mt-1 text-xs text-amber-400">
                    Customer no tiene email guardado. Escribe uno para habilitar “Send”.
                  </div>
                ) : null}
                {to.trim() && !canSend ? (
                  <div className="mt-1 text-xs text-rose-400">Email inválido.</div>
                ) : null}
              </div>

              <div>
                <label className="text-xs text-zinc-500">Notes (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  rows={4}
                  placeholder="Add a short message..."
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setSendOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm hover:bg-zinc-900/40"
              >
                Cancel
              </button>
              <button
                onClick={onSend}
                disabled={!canSend || sending}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}