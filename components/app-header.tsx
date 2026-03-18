"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { projectsApi } from "@/lib/api/projects"
import { useAuth } from "@/contexts/auth-context"

interface AppHeaderProps {
  onToggleSidebar?: () => void
}

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  environments: "Environments",
}

function getBreadcrumbs(
  pathname: string,
  projectNames: Record<string, string>
): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let path = ""

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]
    path += `/${segment}`

    const isProjectId = segments[i - 1] === "projects"
    const rawLabel = isProjectId ? projectNames[segment] || segment : labelMap[segment] || segment
    const label = isProjectId ? rawLabel : rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)

    crumbs.push({ label, href: path })
  }

  return crumbs
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname()
  const { currentOrg } = useAuth()
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean)
    const projectIndex = segments.findIndex((segment) => segment === "projects")
    const projectId = projectIndex >= 0 ? segments[projectIndex + 1] : undefined

    if (!projectId || !currentOrg || projectNames[projectId]) return

    let active = true

    projectsApi
      .get(currentOrg.id, projectId)
      .then((project) => {
        if (!active || !project) return
        setProjectNames((prev) => ({ ...prev, [projectId]: project.name }))
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [pathname, currentOrg, projectNames])

  const breadcrumbs = getBreadcrumbs(pathname, projectNames)

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
