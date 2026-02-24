"use client"

import { MailPlus } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Member } from "@/lib/api/types"

type OrganizationInviteSectionProps = {
  inviteEmail: string
  inviteRole: Member["role"]
  setInviteEmail: (value: string) => void
  setInviteRole: (value: Member["role"]) => void
  isInviting: boolean
  isAdmin: boolean
  onInvite: (event: React.FormEvent<HTMLFormElement>) => void
}

export function OrganizationInviteSection({
  inviteEmail,
  inviteRole,
  setInviteEmail,
  setInviteRole,
  isInviting,
  isAdmin,
  onInvite,
}: OrganizationInviteSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-4 flex items-center gap-2">
        <MailPlus className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Invite member</h2>
          <p className="text-xs text-muted-foreground">Send an invitation by email and choose the role.</p>
        </div>
      </header>
      <Separator className="my-3" />
      <form className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end" onSubmit={onInvite}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="inviteEmail">Email</Label>
          <Input
            id="inviteEmail"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="person@company.com"
            required
            disabled={!isAdmin}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="inviteRole">Role</Label>
          <select
            id="inviteRole"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Member["role"])}
            disabled={!isAdmin}
          >
            <option value="member">Member</option>
            <option value="admin">Owner</option>
          </select>
        </div>
        <Button type="submit" className="h-9" disabled={isInviting || !isAdmin}>
          {isInviting ? "Sending..." : "Send invite"}
        </Button>
      </form>
      {!isAdmin && (
        <p className="mt-3 text-xs text-muted-foreground">Only owners can send invitations.</p>
      )}
    </section>
  )
}
