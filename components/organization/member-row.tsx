"use client"

import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
import { getInitials } from "@/lib/utils/string"
import type { Member } from "@/lib/api/types"

type MemberRowProps = {
  member: Member
}

export function MemberRow({ member }: MemberRowProps) {
  const initials = getInitials(member.name)

  return (
    <div className="grid grid-cols-[1.6fr_1.4fr_0.8fr] items-center px-3 py-2 text-sm">
      <div className="flex items-center gap-2 truncate">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {initials}
        </div>
        <div className="flex flex-col truncate">
          <span className="truncate text-foreground">{member.name || "User"}</span>
          <span className="truncate text-[12px] text-muted-foreground">{member.email}</span>
        </div>
      </div>
      <span className="truncate text-muted-foreground">{member.email}</span>
      <div className="flex items-center gap-2">
        {member.role === "owner" ? (
          <Badge className="gap-1 bg-primary/10 text-primary">
            <Crown className="h-3 w-3" /> Owner
          </Badge>
        ) : (
          <Badge variant="secondary">Member</Badge>
        )}
      </div>
    </div>
  )
}
