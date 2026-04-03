import { Cloud, LogOut, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"

interface Props {
  name: string | undefined
  email: string | undefined
  initials: string
  isOrgAdmin: boolean
  onLogout: () => void
}

export function SidebarUserMenu({ name, email, initials, isOrgAdmin, onLogout }: Props) {
  const router = useRouter()
  return (
    <div className="border-t border-sidebar-border px-3 py-2">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-1 items-center gap-2.5 rounded px-2 py-1.5 text-xs hover:bg-sidebar-accent transition-colors">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-sidebar-primary/10 text-[10px] font-bold text-sidebar-primary">
                {initials}
              </div>
              <div className="flex flex-1 flex-col items-start truncate">
                <span className="truncate text-xs font-medium text-sidebar-foreground">{name}</span>
                <span className="truncate text-[10px] text-muted-foreground">{email}</span>
                {isOrgAdmin && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Owner</span>}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push("/organization")} className="text-xs flex items-center gap-2">
              <Cloud className="h-3.5 w-3.5" />Organization
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/user")} className="text-xs flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5" />Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-xs font-medium">{name}</span>
              <span className="text-[10px] text-muted-foreground font-normal">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive text-xs">
              <LogOut className="h-3 w-3" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
      </div>
    </div>
  )
}
