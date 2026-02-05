import React from "react"

type Org = {
  name: string
  businessName: string | null
  email: string | null
  phone: string | null
  website: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

type Customer = {
  fullName: string
  email: string | null
  phone: string | null
  homeAddress: string | null
  workAddress: string | null
}

type QuoteItem = {
  id: string
  name: string
  type: string
  quantity: number
  unitPrice: any
  lineTotal: any
}

type QuoteDocEstimate = {
  id: string
  title: string
  description: string | null
  notes: string | null
  status: string
  createdAt: Date
  validUntil: Date | null
  poNumber: string | null
  serviceAddress: string | null
  subtotalAmount: any
  discountAmount: any
  taxRate: any
  taxAmount: any
  totalAmount: any
  organization: Org
  customer: Customer
  items: QuoteItem[]
}

function orgDisplayName(org: Org) {
  return (org.businessName?.trim() || org.name || "").trim()
}

function fmtDate(d: Date) {
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return ""
  }
}

function money(v: any) {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return "$0.00"
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function joinParts(parts: (string | null | undefined)[], sep = " • ") {
  return parts.filter(Boolean).join(sep)
}

function orgAddress(org: Org) {
  const cityStateZip = [org.city, org.state, org.zip].filter(Boolean).join(", ").replace(", ,", ", ")
  return [org.addressLine1, org.addressLine2, cityStateZip || null, org.country]
    .filter((x) => (x ?? "").toString().trim().length > 0)
    .map((x) => String(x))
}

type LabeledLine = { label: string; value: string }

function customerAddressBlocks(c: Customer, serviceAddress?: string | null) {
  const blocks: LabeledLine[] = []

  const service = (serviceAddress ?? "").trim()
  const home = (c.homeAddress ?? "").trim()
  const work = (c.workAddress ?? "").trim()

  if (service) blocks.push({ label: "Service Address", value: service })
  if (home) blocks.push({ label: "Home Address", value: home })
  if (work) blocks.push({ label: "Work Address", value: work })

  return blocks
}

export default function QuoteDoc({ estimate }: { estimate: QuoteDocEstimate }) {
  const org = estimate.organization
  const cust = estimate.customer

  const orgLines = orgAddress(org)
  const custBlocks = customerAddressBlocks(cust, estimate.serviceAddress)

  return (
    <div className="quote-root">
      {/* Print CSS */}
      <style>{`
        @media print {
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .quote-sheet { box-shadow: none !important; border: none !important; }
          .quote-border { border-color: #e5e7eb !important; }
          .quote-muted { color: #4b5563 !important; }
          .quote-head { padding: 0 !important; }
          .quote-table thead { background: #f8fafc !important; }
          a { color: #111827 !important; text-decoration: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>

      <div className="quote-sheet quote-border mx-auto w-full max-w-4xl rounded-2xl border bg-white text-zinc-900 shadow-sm">
        {/* Header */}
        <div className="quote-head quote-border flex flex-col gap-6 border-b p-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Org */}
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {org.name}
            </div>
            <div className="mt-1 text-2xl font-semibold leading-tight">
              {orgDisplayName(org)}
            </div>

            <div className="quote-muted mt-3 space-y-1 text-sm text-zinc-600">
              {orgLines.length > 0 ? (
                <div className="whitespace-pre-line">{orgLines.join("\n")}</div>
              ) : null}

              <div>
                {joinParts(
                  [
                    org.email ? `Email: ${org.email}` : null,
                    org.phone ? `Phone: ${org.phone}` : null,
                  ],
                  "  •  "
                )}
              </div>

              {org.website ? (
                <div>
                  Website:{" "}
                  <a className="underline" href={org.website} target="_blank" rel="noreferrer">
                    {org.website}
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          {/* Doc meta */}
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Estimate
                </div>
                <div className="mt-1 text-lg font-semibold">{estimate.title}</div>
                <div className="mt-1 text-xs text-zinc-500">#{estimate.id.slice(0, 8)}</div>
              </div>

              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                {estimate.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Created</div>
                <div className="font-medium">{fmtDate(estimate.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Valid Until</div>
                <div className="font-medium">{estimate.validUntil ? fmtDate(estimate.validUntil) : "—"}</div>
              </div>

              <div className="col-span-2">
                <div className="text-xs text-zinc-500">PO Number</div>
                <div className="font-medium">{estimate.poNumber?.trim() || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer / Notes */}
        <div className="quote-border grid gap-6 border-b p-6 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Bill To
            </div>
            <div className="mt-2 text-lg font-semibold">{cust.fullName}</div>

            <div className="quote-muted mt-2 space-y-2 text-sm text-zinc-600">
              {/* Addresses */}
              {custBlocks.length ? (
                <div className="space-y-2">
                  {custBlocks.map((b) => (
                    <div key={b.label}>
                      <div className="text-xs text-zinc-500">{b.label}</div>
                      <div className="whitespace-pre-line text-zinc-800">{b.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500">—</div>
              )}

              {/* Contact */}
              {(cust.email || cust.phone) ? (
                <div>
                  {joinParts(
                    [
                      cust.email ? `Email: ${cust.email}` : null,
                      cust.phone ? `Phone: ${cust.phone}` : null,
                    ],
                    "  •  "
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Details
            </div>
            <div className="quote-muted mt-2 space-y-2 text-sm text-zinc-600">
              {estimate.description?.trim() ? (
                <div>
                  <div className="text-xs text-zinc-500">Description</div>
                  <div className="text-zinc-800">{estimate.description}</div>
                </div>
              ) : null}

              {estimate.notes?.trim() ? (
                <div>
                  <div className="text-xs text-zinc-500">Notes</div>
                  <div className="text-zinc-800 whitespace-pre-line">{estimate.notes}</div>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-zinc-500">Notes</div>
                  <div className="text-zinc-800">—</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-6">
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="quote-table w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {estimate.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-3 py-2 font-medium text-zinc-900">{it.name}</td>
                    <td className="px-3 py-2 text-zinc-600">{it.type}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(it.unitPrice)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal</span>
                <span className="tabular-nums font-medium">{money(estimate.subtotalAmount)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-zinc-600">Discount</span>
                <span className="tabular-nums font-medium">-{money(estimate.discountAmount)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-zinc-600">Tax</span>
                <span className="tabular-nums font-medium">{money(estimate.taxAmount)}</span>
              </div>
              <div className="mt-3 border-t border-zinc-200 pt-3 flex justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="tabular-nums font-semibold">{money(estimate.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="quote-border border-t px-6 py-4 text-center text-xs text-zinc-500">
          Powered by {orgDisplayName(org)}
        </div>
      </div>
    </div>
  )
}