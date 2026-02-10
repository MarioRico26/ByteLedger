export type NavItem = { label: string; href: string; requiresSuperAdmin?: boolean }
export type NavGroup = { label: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Core",
    items: [{ label: "Dashboard", href: "/" }],
  },
  {
    label: "Sales",
    items: [
      { label: "Estimates", href: "/estimates" },
      { label: "Sales", href: "/sales" },
      { label: "Payments", href: "/payments" },
      { label: "Reports", href: "/reports" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Customers", href: "/customers" },
      { label: "Products", href: "/products" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Organization", href: "/settings/organization" },
      { label: "Disclaimer", href: "/settings/organization#disclaimer" },
      { label: "User Manual", href: "/manual" },
      { label: "Admin", href: "/admin", requiresSuperAdmin: true },
    ],
  },
]
