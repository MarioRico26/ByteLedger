//byteledger/src/app/estimates/page.tsx:
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DEFAULT_ORG_ID } from "@/lib/tenant"

export default async function EstimatesPage() {
  const estimates = await prisma.estimate.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-black p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Estimates</h1>

          <Link
            href="/estimates/new"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            New Estimate
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {estimates.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-zinc-400">
              No estimates yet.
            </div>
          ) : (
            estimates.map((e) => (
              <Link
                key={e.id}
                href={`/estimates/${e.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 hover:bg-zinc-900/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-100">
                      {e.title}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {e.customer.fullName}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      ${Number(e.totalAmount).toFixed(2)}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      {e.status}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="mt-6 text-xs text-zinc-500">
          Powered by <span className="font-semibold text-zinc-300">Byte Networks</span>
        </div>
      </div>
    </div>
  )
}