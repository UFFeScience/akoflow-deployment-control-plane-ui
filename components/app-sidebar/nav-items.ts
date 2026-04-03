import { FolderKanban, Cloud, Server, FileCode2, LayoutDashboard } from "lucide-react"

export type NavChild = { label: string; hrefSuffix: string; icon: React.ElementType }
export type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  children?: NavChild[]
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    children: [],
  },
  {
    label: "Organization",
    href: "/organization",
    icon: Cloud,
    children: [
      { label: "Providers", hrefSuffix: "/providers", icon: Server },
      { label: "Templates", hrefSuffix: "/templates", icon: FileCode2 },
    ],
  },
]
