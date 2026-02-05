export type NavItem = { label: string; href: string }

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Customers", href: "/customers" },
  { label: "Catalog", href: "/products" },   // ✅ consistente con tu app
  { label: "Estimates", href: "/estimates" }, // ✅ LISTADO, no edit
  { label: "Sales", href: "/sales" },
  { label: "Payments", href: "/payments" },
  { label: "Settings", href: "/settings/organization" },
]