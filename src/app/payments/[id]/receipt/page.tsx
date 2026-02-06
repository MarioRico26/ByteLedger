import { prisma } from "@/lib/prisma"
import { requireOrgId } from "@/lib/auth"
import PrintButton from "@/app/sales/[id]/invoice/PrintButton"
import SendReceiptModal from "./SendReceiptModal"

function money(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function fmtMoney(v: any) {
  return money(v).toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function formatDate(value?: Date | string | null) {
  if (!value) return ""
  try {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.valueOf())) return ""
    return d.toLocaleDateString()
  } catch {
    return ""
  }
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const orgId = await requireOrgId()

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      organization: true,
      sale: {
        include: {
          customer: true,
          organization: true,
          payments: { orderBy: { paidAt: "asc" } },
        },
      },
    },
  })

  if (!payment) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
        <div className="font-semibold">Receipt not found</div>
      </div>
    )
  }

  if (payment.organizationId !== orgId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        Not authorized.
      </div>
    )
  }

  const sale = payment.sale
  const org = payment.organization || sale.organization
  const orgName = org?.businessName || org?.name || "Organization"

  const receiptNumber = `RCP-${payment.paidAt.getFullYear()}-${payment.id
    .slice(-6)
    .toUpperCase()}`
  const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id
    .slice(-6)
    .toUpperCase()}`

  const total = money(sale.totalAmount)
  const cust = sale.customer
  const billToAddress = cust.workAddress || cust.homeAddress || null

  const paymentsSorted = [...(sale.payments || [])].sort((a, b) => {
    const ta = new Date(a.paidAt).getTime()
    const tb = new Date(b.paidAt).getTime()
    if (ta !== tb) return ta - tb
    return a.id.localeCompare(b.id)
  })

  let paidThrough = 0
  for (const p of paymentsSorted) {
    paidThrough += money(p.amount)
    if (p.id === payment.id) break
  }

  const remaining = Math.max(total - paidThrough, 0)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl p-8 print:p-0">
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-start gap-4">
            {org?.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={`${orgName} logo`}
                className="h-24 w-24 rounded-2xl border border-slate-200 bg-white object-contain"
              />
            ) : null}
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">{orgName}</div>
              <h1 className="mt-1 text-2xl font-semibold">Payment Receipt</h1>

              <div className="mt-2 text-sm text-slate-700">
                Receipt #: <span className="font-semibold">{receiptNumber}</span>
              </div>
              <div className="text-sm text-slate-700">
                Date: <span className="font-semibold">{formatDate(payment.paidAt)}</span>
              </div>
              <div className="text-sm text-slate-700">
                Invoice #: <span className="font-semibold">{invoiceNumber}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 print:hidden">
            <SendReceiptModal paymentId={payment.id} defaultTo={sale.customer.email || ""} />
            <PrintButton />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">From</div>
            <div className="mt-2 text-sm font-semibold">{orgName}</div>

            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {org?.email ? <div>{org.email}</div> : null}
              {org?.phone ? <div>{org.phone}</div> : null}
              {org?.website ? <div>{org.website}</div> : null}
            </div>

            {(org?.addressLine1 ||
              org?.addressLine2 ||
              org?.city ||
              org?.state ||
              org?.zip ||
              org?.country) && (
              <div className="mt-3 text-sm text-slate-700">
                <div className="font-medium text-slate-600">Address</div>
                <div className="mt-1">
                  {org?.addressLine1 ? <div>{org.addressLine1}</div> : null}
                  {org?.addressLine2 ? <div>{org.addressLine2}</div> : null}
                  <div>{[org?.city, org?.state, org?.zip].filter(Boolean).join(", ")}</div>
                  {org?.country ? <div>{org.country}</div> : null}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Bill To</div>
            <div className="mt-2 text-sm font-semibold">{cust.fullName}</div>

            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {cust.email ? <div>{cust.email}</div> : null}
              {cust.phone ? <div>{cust.phone}</div> : null}
              {billToAddress ? (
                <div className="pt-2">
                  <div className="text-xs font-medium text-slate-600">Address</div>
                  <div className="mt-1 text-sm text-slate-700 whitespace-pre-line">
                    {billToAddress}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Payment Details</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Amount</span>
                <span className="font-semibold">{fmtMoney(payment.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Method</span>
                <span className="font-semibold">{payment.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Paid at</span>
                <span className="font-semibold">{formatDate(payment.paidAt)}</span>
              </div>
              {payment.notes ? (
                <div className="pt-2 text-slate-600">Notes: {payment.notes}</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Sale Summary</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Sale</span>
                <span className="font-semibold">{sale.description}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold">{fmtMoney(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Paid (to this receipt)</span>
                <span className="font-semibold">{fmtMoney(paidThrough)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold">Remaining</span>
                <span className="font-semibold">{fmtMoney(remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <div className="font-semibold text-slate-700">Thank you for your business.</div>
          <div className="mt-1">
            Powered by <span className="font-semibold">Byte Networks</span>
          </div>
        </div>
      </div>
    </div>
  )
}
