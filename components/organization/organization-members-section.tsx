"use client"

import { UsersRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Member } from "@/lib/api/types"
import { MemberRow } from "./member-row"

type OrganizationMembersSectionProps = {
  members: Member[]
  isLoading: boolean
  isAdmin: boolean
}

export function OrganizationMembersSection({ members, isLoading, isAdmin }: OrganizationMembersSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Members</h2>
            <p className="text-xs text-muted-foreground">Users with access to the organization.</p>
          </div>
        </div>
        {isAdmin && (
          <Badge variant="outline" className="gap-1 text-[11px]">
            Owner
          </Badge>
        )}
      </header>
      <Separator className="my-3" />
      <div className="overflow-hidden rounded-md border border-border/70">
        <div className="grid grid-cols-[1.6fr_1.4fr_0.8fr] items-center bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center px-3 py-4 text-sm text-muted-foreground">
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="flex items-center justify-center px-3 py-4 text-sm text-muted-foreground">
            No members found.
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {members.map((member, idx) => (
              <MemberRow key={idx} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
