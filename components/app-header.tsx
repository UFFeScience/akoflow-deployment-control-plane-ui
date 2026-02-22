"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  onToggleSidebar?: () => void
}

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  experiments: "Experiments",
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let path = ""
  for (const segment of segments) {
    path += `/${segment}`
    const label = labelMap[segment] || segment
    crumbs.push({ label: label.charAt(0).toUpperCase() + label.slice(1), href: path })
  }
  return crumbs
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-10 items-center gap-3 border-b border-border bg-card px-4" role="banner">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="h-3.5 w-3.5" />
      </Button>

      <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground truncate max-w-48">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground truncate max-w-48 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
