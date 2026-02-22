"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  Cloud,
  LogOut,
  ChevronsUpDown,
  Check,
  UserRound,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { membersApi } from "@/lib/api/members"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, organizations, currentOrg, setCurrentOrg, logout } = useAuth()
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?"

  useEffect(() => {
    let active = true
    async function loadRole() {
      if (!currentOrg || !user) {
        if (active) setIsOrgAdmin(false)
        return
      }
      try {
        const members = await membersApi.list(currentOrg.id)
        const normalized = members.map((m: any) => ({
          userId: m.user_id ?? m.userId ?? m.user?.id,
          email: m.email ?? m.user?.email,
          role: m.role,
        }))
        const me = normalized.find((m) => m.userId === user.id || m.email === user.email)
        if (active) setIsOrgAdmin(me?.role === "admin" || me?.role === "owner")
      } catch {
        if (active) setIsOrgAdmin(false)
      }
    }
    loadRole()
    return () => {
      active = false
    }
  }, [currentOrg, user])

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-12 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Cloud className="h-4 w-4 text-sidebar-primary" />
        <span className="text-sm font-bold tracking-tight text-sidebar-foreground">AkoCloud</span>
      </div>

      {/* Org Switcher */}
      <div className="border-b border-sidebar-border px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <span className="truncate">{currentOrg?.name || "Select org"}</span>
              <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Organizations</DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem key={org.id} onClick={() => setCurrentOrg(org)} className="flex items-center justify-between text-xs">
                <span className="truncate">{org.name}</span>
                {currentOrg?.id === org.id && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5" role="list">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex flex-1 items-center gap-2.5 rounded px-2 py-1.5 text-xs hover:bg-sidebar-accent transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-sidebar-primary/10 text-[10px] font-bold text-sidebar-primary">
                  {initials}
                </div>
                <div className="flex flex-1 flex-col items-start truncate">
                  <span className="truncate text-xs font-medium text-sidebar-foreground">{user?.name}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
                  {isOrgAdmin && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Owner</span>}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push("/organization")} className="text-xs flex items-center gap-2">
                <Cloud className="h-3.5 w-3.5" />
                Organization
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/user")} className="text-xs flex items-center gap-2">
                <UserRound className="h-3.5 w-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-xs font-medium">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground font-normal">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive text-xs">
                <LogOut className="h-3 w-3" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
