import { Check, ChevronsUpDown } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Organization } from "@/lib/api/types"

interface Props {
  currentOrg: Organization | null
  organizations: Organization[]
  onSelect: (org: Organization) => void
}

export function OrgSwitcher({ currentOrg, organizations, onSelect }: Props) {
  return (
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
            <DropdownMenuItem key={org.id} onClick={() => onSelect(org)} className="flex items-center justify-between text-xs">
              <span className="truncate">{org.name}</span>
              {currentOrg?.id === org.id && <Check className="h-3 w-3 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
