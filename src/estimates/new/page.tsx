import Link from "next/link"
import NewEstimateForm from "./ui/NewEstimateForm"

export default function NewEstimatePage() {
  return (
    <div className="min-h-screen bg-black p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/estimates"
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              ← Back
            </Link>
            <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
              ByteLedger
            </div>
            <h1 className="mt-1 text-2xl font-semibold">New Estimate</h1>
            <div className="mt-2 text-sm text-zinc-400">
              Build a quote and send it to your customer.
            </div>
          </div>
        </div>

        <div className="mt-6">
          <NewEstimateForm />
        </div>
      </div>
    </div>
  )
}