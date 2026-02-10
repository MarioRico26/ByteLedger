type Section = {
  title: string
  points: { en: string; es: string }[]
}

const sections: Section[] = [
  {
    title: "1. Getting Started / Inicio",
    points: [
      {
        en: "Sign in with your organization email and password.",
        es: "Inicia sesión con el correo de tu organización y tu contraseña.",
      },
      {
        en: "First login requires password change.",
        es: "El primer inicio de sesión requiere cambio de contraseña.",
      },
      {
        en: "Dashboard shows balances, due dates, and activity.",
        es: "El Dashboard muestra balances, vencimientos y actividad.",
      },
    ],
  },
  {
    title: "2. Catalog / Catálogo",
    points: [
      {
        en: "Create customers under Catalog > Customers.",
        es: "Crea clientes en Catálogo > Customers.",
      },
      {
        en: "Create products/services under Catalog > Products.",
        es: "Crea productos/servicios en Catálogo > Products.",
      },
      {
        en: "Product photos are optional and supported.",
        es: "Las fotos de producto son opcionales y están soportadas.",
      },
    ],
  },
  {
    title: "3. Estimates / Cotizaciones",
    points: [
      {
        en: "Create and send estimates from Sales > Estimates.",
        es: "Crea y envía cotizaciones desde Sales > Estimates.",
      },
      {
        en: "Set discount as amount ($) or percentage (%).",
        es: "Configura descuento como monto ($) o porcentaje (%).",
      },
      {
        en: "Download/print quote format from detail screen.",
        es: "Descarga/imprime el formato desde el detalle.",
      },
    ],
  },
  {
    title: "4. Sales & Invoices / Ventas y Facturas",
    points: [
      {
        en: "Create invoices from Sales or convert an estimate.",
        es: "Crea facturas desde Sales o convierte una cotización.",
      },
      {
        en: "Track due date, paid amount, and balance.",
        es: "Da seguimiento a vencimiento, pagado y balance.",
      },
      {
        en: "Invoice emails include PDF attachment.",
        es: "Los correos de factura incluyen adjunto PDF.",
      },
    ],
  },
  {
    title: "5. Payments / Pagos",
    points: [
      {
        en: "Register payments from a sale or in Payments module.",
        es: "Registra pagos desde una venta o en el módulo Payments.",
      },
      {
        en: "Overpayments are blocked by validation.",
        es: "Los sobrepagos son bloqueados por validación.",
      },
      {
        en: "Receipts include full payment details.",
        es: "Los recibos incluyen detalle completo del pago.",
      },
    ],
  },
  {
    title: "6. Reports / Reportes",
    points: [
      {
        en: "Use Reports for KPIs, trend views, and exports.",
        es: "Usa Reports para KPIs, tendencias y exportaciones.",
      },
      {
        en: "Filter by date range and review outstanding balances.",
        es: "Filtra por rango de fechas y revisa balances pendientes.",
      },
    ],
  },
  {
    title: "7. Admin / Administración",
    points: [
      {
        en: "Create organizations and initial users.",
        es: "Crea organizaciones y usuarios iniciales.",
      },
      {
        en: "Enable/disable users or define date-based access windows.",
        es: "Habilita/deshabilita usuarios o define ventana de acceso por fechas.",
      },
      {
        en: "Benchmarking panel shows usage and transaction volume per organization.",
        es: "El panel de benchmarking muestra uso y volumen transaccional por organización.",
      },
    ],
  },
  {
    title: "8. Support / Soporte",
    points: [
      {
        en: "For blocked access or account issues contact ByteNetworks.",
        es: "Para acceso bloqueado o problemas de cuenta, contacta a ByteNetworks.",
      },
      {
        en: "Email: info@bytenetworks.net | Tel: 6097137333",
        es: "Correo: info@bytenetworks.net | Tel: 6097137333",
      },
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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          ByteLedger User Manual (EN/ES)
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Operational guide in English and Spanish for end users and admins.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {section.points.map((point) => (
                <li key={point.en} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="font-medium text-slate-900">EN: {point.en}</div>
                  <div className="mt-1 text-slate-600">ES: {point.es}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
