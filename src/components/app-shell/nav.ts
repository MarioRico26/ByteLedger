export type NavItem = { label: string; href: string }

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Customers", href: "/customers" },
  { label: "Catalog", href: "/catalog" },
  { label: "Estimates", href: "/estimates" }, // ✅ ESTO ES LO QUE FALTABA
  { label: "Sales", href: "/sales" },
  { label: "Payments", href: "/payments" },
  { label: "Settings", href: "/settings/organization" },
]