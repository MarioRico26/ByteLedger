const sections = [
  {
    title: "1. Getting Started",
    bullets: [
      "Sign in with your organization email and password.",
      "If this is your first login, you will be asked to set a new password.",
      "Use the Dashboard for a quick view of balances, recent activity, and upcoming due dates.",
    ],
  },
  {
    title: "2. Catalog Setup",
    bullets: [
      "Create customers in Catalog > Customers with contact details and addresses.",
      "Create products/services in Catalog > Products, including optional item photos.",
      "Only active products are shown by default in sales/estimate item pickers.",
    ],
  },
  {
    title: "3. Estimates",
    bullets: [
      "Create estimates from Sales > Estimates.",
      "Add line items, tax, and discount ($ or %).",
      "Send, print, and download quote documents from the estimate view.",
    ],
  },
  {
    title: "4. Sales & Invoices",
    bullets: [
      "Create invoices from Sales > Sales or convert an estimate to sale.",
      "Track due date, paid amount, and remaining balance.",
      "Send invoice emails with PDF attachment.",
    ],
  },
  {
    title: "5. Payments",
    bullets: [
      "Register payments from the sale card or from Sales > Payments.",
      "System validates that payment does not exceed remaining balance.",
      "Generate and send payment receipts with full payment details.",
    ],
  },
  {
    title: "6. Reports",
    bullets: [
      "Open Sales > Reports for KPI cards, trend charts, and date filters.",
      "Use CSV/PDF exports when needed for accounting or audits.",
      "Review outstanding balances and collection performance periodically.",
    ],
  },
  {
    title: "7. Organization Settings",
    bullets: [
      "Update organization identity, contact info, logo, and tax defaults.",
      "Changes reflect in estimate, invoice, and receipt documents.",
      "Use recurring defaults for consistent billing behavior.",
    ],
  },
  {
    title: "8. Admin (Superadmin)",
    bullets: [
      "Create organizations and initial users.",
      "Enable/disable users and set access date windows for demos.",
      "Use Admin benchmarking to compare org activity and transaction volume.",
    ],
  },
  {
    title: "9. Access & Support",
    bullets: [
      "Disabled or expired users cannot log in.",
      "If access is blocked, user must contact ByteNetworks support.",
      "Recommended support email: support@bytenetworks.net",
    ],
  },
]

export default function ManualPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Documentation
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">ByteLedger User Manual</h1>
        <p className="mt-2 text-sm text-slate-500">
          Operational guide for daily usage, onboarding, and admin management.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {section.bullets.map((item) => (
                <li key={item} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
