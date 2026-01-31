// byteledger/src/app/estimates/ui/QuoteDoc.tsx
import type { EstimateStatus, ProductType } from "@prisma/client"

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

type Cust = {
  fullName: string
  email: string | null
  phone: string | null
  homeAddress: string | null
  workAddress: string | null
}

type Item = {
  id: string
  type: ProductType
  name: string
  quantity: number
  unitPrice: any
  lineTotal: any
}

export type QuoteDocData = {
  id: string
  title: string
  status: EstimateStatus
  createdAt: Date
  saleId: string | null
  publicToken: string | null

  subtotalAmount: any
  taxRate: any
  taxAmount: any
  discountAmount: any
  totalAmount: any

  notes: string | null
  organization: Org
  customer: Cust
  items: Item[]
}

function money(v: any) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "$0.00"
  return `$${n.toFixed(2)}`
}

function line(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ")
}

export default function QuoteDoc({ data }: { data: QuoteDocData }) {
  const org = data.organization
  const cust = data.customer

  const orgName = org.businessName || org.name
  const orgAddr = line(org.addressLine1, org.addressLine2, line(org.city, org.state, org.zip), org.country)

  const custAddr = cust.workAddress || cust.homeAddress || null

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs text-zinc-500">Estimate / Quote</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100">
              {data.title}
            </h1>
            <div className="mt-1 text-sm text-zinc-400">
              #{data.id.slice(0, 8)} • {new Date(data.createdAt).toLocaleDateString()} •{" "}
              <span className="rounded-full border border-zinc-800 bg-zinc-900/30 px-2 py-0.5 text-[11px] text-zinc-300">
                {data.status}
              </span>
            </div>
          </div>

          <div className="text-right text-sm text-zinc-400">
            <div className="text-zinc-200">{orgName}</div>
            {org.email ? <div>{org.email}</div> : null}
            {org.phone ? <div>{org.phone}</div> : null}
            {org.website ? <div className="text-zinc-500">{org.website}</div> : null}
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
          <div className="text-xs text-zinc-500">From</div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">{orgName}</div>
          {orgAddr ? <div className="mt-1 text-sm text-zinc-400">{orgAddr}</div> : null}
          <div className="mt-2 text-xs text-zinc-500">
            {[org.email, org.phone].filter(Boolean).join(" • ")}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
          <div className="text-xs text-zinc-500">To</div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">{cust.fullName}</div>
          {custAddr ? <div className="mt-1 text-sm text-zinc-400">{custAddr}</div> : null}
          <div className="mt-2 text-xs text-zinc-500">
            {[cust.email, cust.phone].filter(Boolean).join(" • ")}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/60 text-xs text-zinc-400">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Unit</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/30">
            {data.items.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-3 text-zinc-100">{it.name}</td>
                <td className="px-4 py-3 text-zinc-300">{it.type}</td>
                <td className="px-4 py-3 text-right text-zinc-300">{it.quantity}</td>
                <td className="px-4 py-3 text-right text-zinc-300">{money(it.unitPrice)}</td>
                <td className="px-4 py-3 text-right text-zinc-100">{money(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm">
          <div className="flex justify-between text-zinc-300">
            <span>Subtotal</span>
            <span className="text-zinc-100">{money(data.subtotalAmount)}</span>
          </div>

          <div className="flex justify-between text-zinc-300">
            <span>Tax ({Number(data.taxRate || 0).toFixed(2)}%)</span>
            <span className="text-zinc-100">{money(data.taxAmount)}</span>
          </div>

          <div className="flex justify-between text-zinc-300">
            <span>Discount</span>
            <span className="text-zinc-100">- {money(data.discountAmount)}</span>
          </div>

          <div className="mt-2 border-t border-zinc-800 pt-3 flex justify-between text-zinc-100">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{money(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      {data.notes ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-300">
          <div className="text-xs text-zinc-500">Notes</div>
          <div className="mt-1 whitespace-pre-wrap">{data.notes}</div>
        </div>
      ) : null}

      <div className="pb-10 text-center text-xs text-zinc-500">
        Powered by <span className="text-zinc-300">ByteNetworks</span>
      </div>
    </div>
  )
}