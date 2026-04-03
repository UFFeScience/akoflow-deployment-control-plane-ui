import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavItem } from "./nav-items"

interface Props {
  item: NavItem
  pathname: string
  currentProjectId: string | null
  isOpen: boolean
  onToggle: () => void
}

export function NavItemRenderer({ item, pathname, currentProjectId, isOpen, onToggle }: Props) {
  const isActive     = pathname === item.href || pathname.startsWith(item.href + "/")
  const hasChildren  = !!item.children?.length

  const linkClass = (active: boolean) => cn(
    "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
    active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
  )

  return (
    <li>
      {hasChildren ? (
        <div className={cn(
          "flex w-full items-center rounded text-xs font-medium transition-colors",
          isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}>
          <Link href={item.href} className="flex flex-1 items-center gap-2.5 px-2.5 py-1.5"
            aria-current={pathname === item.href ? "page" : undefined}>
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
          </Link>
          <button onClick={onToggle} className="px-2 py-1.5 rounded-r" aria-label={isOpen ? "Collapse" : "Expand"}>
            {isOpen ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          </button>
        </div>
      ) : (
        <Link href={item.href} className={linkClass(isActive)} aria-current={isActive ? "page" : undefined}>
          <item.icon className="h-3.5 w-3.5 shrink-0" />{item.label}
        </Link>
      )}

      {hasChildren && isOpen && (
        <ul className="mt-0.5 flex flex-col gap-0.5 pl-4" role="list">
          {(item.label === "Projects" && currentProjectId ? item.children! : item.children!).map((child) => {
            const childHref = item.label === "Projects" && currentProjectId
              ? `/projects/${currentProjectId}${child.hrefSuffix}`
              : item.href + child.hrefSuffix
            const isChildActive = pathname === childHref || pathname.startsWith(childHref + "/")
            return (
              <li key={child.hrefSuffix}>
                <Link href={childHref} className={linkClass(isChildActive)} aria-current={isChildActive ? "page" : undefined}>
                  <child.icon className="h-3 w-3 shrink-0" />{child.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
