"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Cloud } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { membersApi } from "@/lib/api/members"
import { navItems } from "./app-sidebar/nav-items"
import { NavItemRenderer } from "./app-sidebar/nav-item"
import { OrgSwitcher } from "./app-sidebar/org-switcher"
import { SidebarUserMenu } from "./app-sidebar/user-menu"
import type { Organization } from "@/lib/api/types"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, organizations, currentOrg, setCurrentOrg, logout } = useAuth()
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)
  const [openMenus, setOpenMenus]   = useState<Record<string, boolean>>({})

  const projectMatch     = pathname.match(/^\/projects\/([^/]+)/)
  const currentProjectId = projectMatch ? projectMatch[1] : null

  useEffect(() => {
    if (currentProjectId) setOpenMenus((prev) => ({ ...prev, Projects: true }))
  }, [currentProjectId])

  useEffect(() => {
    if (pathname.startsWith("/organization")) setOpenMenus((prev) => ({ ...prev, Organization: true }))
  }, [pathname])

  useEffect(() => {
    let active = true
    async function loadRole() {
      if (!currentOrg || !user) { if (active) setIsOrgAdmin(false); return }
      try {
        const members = await membersApi.list(currentOrg.id)
        const normalized = members.map((m: any) => ({
          userId: m.user_id ?? m.userId ?? m.user?.id,
          email: m.email ?? m.user?.email,
          role: m.role,
        }))
        const me = normalized.find((m) => m.userId === user.id || m.email === user.email)
        if (active) setIsOrgAdmin(me?.role === "admin" || me?.role === "owner")
      } catch { if (active) setIsOrgAdmin(false) }
    }
    loadRole()
    return () => { active = false }
  }, [currentOrg, user])

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?"

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-12 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Cloud className="h-4 w-4 text-sidebar-primary" />
        <span className="text-sm font-bold tracking-tight text-sidebar-foreground">AkôFlow</span>
      </div>

      <OrgSwitcher
        currentOrg={currentOrg}
        organizations={organizations}
        onSelect={(org: Organization) => setCurrentOrg(org)}
      />

      <nav className="flex-1 px-3 py-3" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5" role="list">
          {navItems.map((item) => (
            <NavItemRenderer
              key={item.href}
              item={item}
              pathname={pathname}
              currentProjectId={currentProjectId}
              isOpen={openMenus[item.label] ?? false}
              onToggle={() => setOpenMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
            />
          ))}
        </ul>
      </nav>

      <SidebarUserMenu
        name={user?.name}
        email={user?.email}
        initials={initials}
        isOrgAdmin={isOrgAdmin}
        onLogout={logout}
      />
    </aside>
  )
}
