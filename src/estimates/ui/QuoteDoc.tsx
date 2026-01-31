import Link from "next/link"

type MoneyLike = string | number | null | undefined

function money(n: MoneyLike) {
  const v = typeof n === "string" ? Number(n) : typeof n === "number" ? n : 0
  return Number.isFinite(v) ? v : 0
}

function fmtMoney(n: MoneyLike) {
  return `$${money(n).toFixed(2)}`
}

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

type Item = {
  id: string
  name: string
  type: "PRODUCT" | "SERVICE"
  quantity: number
  unitPrice: MoneyLike
  lineTotal: MoneyLike
}

export type QuoteDocProps = {
  mode?: "internal" | "public"
  estimate: {
    id: string
    title: string
    status: string
    createdAt: Date | string
    subtotalAmount: MoneyLike
    discountAmount: MoneyLike
    taxRate: MoneyLike
    taxAmount: MoneyLike
    totalAmount: MoneyLike
    notes: string | null
    saleId: string | null
    publicToken: string | null
  }
  organization: Org
  customer: Customer
  items: Item[]
}

function orgDisplayName(o: Org) {
  return o.businessName?.trim() || o.name
}

function joinNonEmpty(parts: Array<string | null | undefined>, sep = ", ") {
  return parts.map(p => (p || "").trim()).filter(Boolean).join(sep)
}

function formatOrgAddress(o: Org) {
  const line1 = joinNonEmpty([o.addressLine1, o.addressLine2], " ")
  const line2 = joinNonEmpty([o.city, o.state, o.zip])
  const line3 = o.country?.trim() || ""
  return [line1, line2, line3].filter(Boolean)
}

function formatCustomerAddress(c: Customer) {
  const preferred = (c.workAddress || c.homeAddress || "").trim()
  if (!preferred) return []
  return preferred.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}

export default function QuoteDoc(props: QuoteDocProps) {
  const { estimate, organization, customer, items } = props
  const orgLines = formatOrgAddress(organization)
  const custLines = formatCustomerAddress(customer)

  const created = (() => {
    try {
      return new Date(estimate.createdAt).toLocaleDateString()
    } catch {
      return ""
    }
  })()

  const taxRateNum = money(estimate.taxRate)
  const discountNum = money(estimate.discountAmount)

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">Estimate</div>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
              {estimate.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-full border border-zinc-800 bg-zinc-900/40 px-2 py-0.5">
                ID: {estimate.id}
              </span>
              {created ? (
                <span className="rounded-full border border-zinc-800 bg-zinc-900/40 px-2 py-0.5">
                  Date: {created}
                </span>
              ) : null}
              <span className="rounded-full border border-zinc-800 bg-zinc-900/40 px-2 py-0.5">
                Status: {estimate.status}
              </span>
              {estimate.saleId ? (
                <span className="rounded-full border border-emerald-900/50 bg-emerald-950/30 px-2 py-0.5 text-emerald-300">
                  Converted to sale
                </span>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs text-zinc-400">Total</div>
            <div className="mt-1 text-3xl font-semibold">{fmtMoney(estimate.totalAmount)}</div>
            <div className="mt-1 text-xs text-zinc-500">
              Powered by <span className="text-zinc-300">Byte Networks</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-400">From</div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">
              {orgDisplayName(organization)}
            </div>
            {orgLines.length ? (
              <div className="mt-2 space-y-1 text-xs text-zinc-400">
                {orgLines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
            ) : null}
            <div className="mt-2 space-y-1 text-xs text-zinc-400">
              {organization.email ? <div>{organization.email}</div> : null}
              {organization.phone ? <div>{organization.phone}</div> : null}
              {organization.website ? <div>{organization.website}</div> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-400">To</div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">
              {customer.fullName}
            </div>
            {custLines.length ? (
              <div className="mt-2 space-y-1 text-xs text-zinc-400">
                {custLines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
            ) : null}
            <div className="mt-2 space-y-1 text-xs text-zinc-400">
              {customer.email ? <div>{customer.email}</div> : null}
              {customer.phone ? <div>{customer.phone}</div> : null}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800">
          <div className="grid grid-cols-12 bg-zinc-950/60 px-4 py-3 text-[11px] font-medium text-zinc-400">
            <div className="col-span-6">Item</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-zinc-800">
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-12 px-4 py-3 text-sm">
                <div className="col-span-6 min-w-0">
                  <div className="truncate font-medium text-zinc-100">{it.name}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">{it.type}</div>
                </div>
                <div className="col-span-2 text-right text-zinc-200">{it.quantity}</div>
                <div className="col-span-2 text-right text-zinc-200">{fmtMoney(it.unitPrice)}</div>
                <div className="col-span-2 text-right font-medium text-zinc-100">{fmtMoney(it.lineTotal)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:justify-end">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between text-sm text-zinc-300">
              <span>Subtotal</span>
              <span className="font-medium text-zinc-100">{fmtMoney(estimate.subtotalAmount)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm text-zinc-300">
              <span>
                Discount
                {discountNum > 0 ? <span className="text-xs text-zinc-500"> (amount)</span> : null}
              </span>
              <span className="font-medium text-zinc-100">- {fmtMoney(discountNum)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm text-zinc-300">
              <span>
                Tax
                {taxRateNum > 0 ? (
                  <span className="text-xs text-zinc-500"> ({taxRateNum.toFixed(3)}%)</span>
                ) : null}
              </span>
              <span className="font-medium text-zinc-100">{fmtMoney(estimate.taxAmount)}</span>
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-3">
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-zinc-100">Total</span>
                <span className="font-semibold text-zinc-100">{fmtMoney(estimate.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {estimate.notes ? (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-400">Notes</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{estimate.notes}</div>
          </div>
        ) : null}

        {props.mode === "internal" && estimate.publicToken ? (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-400">Public link</div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-zinc-300">
                Share this view-only link with the customer.
              </div>
              <Link
                href={`/q/${estimate.publicToken}`}
                target="_blank"
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
              >
                Open Public Quote
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
