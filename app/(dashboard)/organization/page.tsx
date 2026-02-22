"use client"

import { useEffect, useMemo, useState } from "react"
import { Shield, UsersRound, MailPlus, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { membersApi } from "@/lib/api/members"
import type { Member } from "@/lib/api/types"
import { toast } from "sonner"

export default function OrganizationPage() {
  const { currentOrg, user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Member["role"]>("member")
  const [isInviting, setIsInviting] = useState(false)

  const isAdmin = useMemo(() => {
    const me = members.find((m) => m.userId === user?.id || m.email === user?.email)
    return me?.role === "admin" || me?.role === "owner"
  }, [members, user])

  useEffect(() => {
    let active = true

    async function loadMembers() {
      if (!currentOrg) {
        setMembers([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const list = await membersApi.list(currentOrg.id)
        const normalized = list.map((m) => ({
          id: (m as any).id ?? (m as any).user_id ?? m.userId,
          userId: (m as any).user_id ?? m.userId,
          email: (m as any).email ?? (m as any).user?.email,
          name: (m as any).name ?? (m as any).user?.name,
          role: (m as any).role,
          joinedAt: (m as any).joined_at ?? m.joinedAt,
        })) as Member[]
        if (active) setMembers(normalized)
      } catch (error) {
        if (active) {
          setMembers([])
          const message = error instanceof Error ? error.message : "Failed to load members"
          toast.error(message)
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadMembers()
    return () => {
      active = false
    }
  }, [currentOrg])

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentOrg) return
    setIsInviting(true)
    try {
      const created = await membersApi.add(currentOrg.id, { email: inviteEmail, role: inviteRole })
      setMembers((prev) => {
        const exists = prev.some((m) => m.email === created.email)
        return exists ? prev : [created, ...prev]
      })
      setInviteEmail("")
      setInviteRole("member")
      toast.success("Invite sent")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send invite"
      toast.error(message)
    } finally {
      setIsInviting(false)
    }
  }

  if (!currentOrg) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Select an organization to manage IAM.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
          <h1 className="text-lg font-semibold text-foreground">IAM & Access</h1>
          <p className="text-sm text-muted-foreground">Manage members, invitations, and roles for {currentOrg.name}.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Owners can manage access; members have read-only view.</span>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Members</h2>
              <p className="text-xs text-muted-foreground">Users with access to the organization.</p>
            </div>
          </div>
          {isAdmin && <Badge variant="outline" className="gap-1 text-[11px]">Owner</Badge>}
        </header>
        <Separator className="my-3" />
        <div className="overflow-hidden rounded-md border border-border/70">
          <div className="grid grid-cols-[1.6fr_1.4fr_0.8fr] items-center bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center px-3 py-4 text-sm text-muted-foreground">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center px-3 py-4 text-sm text-muted-foreground">No members found.</div>
          ) : (
            <div className="divide-y divide-border/70">
              {members.map((member, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1.6fr_1.4fr_0.8fr] items-center px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {member.name
                        ? member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "?"}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="truncate text-foreground">{member.name || "User"}</span>
                      <span className="truncate text-[12px] text-muted-foreground">{member.email}</span>
                    </div>
                  </div>
                  <span className="truncate text-muted-foreground">{member.email}</span>
                  <div className="flex items-center gap-2">
                    {member.role === "admin" || member.role === "owner" ? (
                      <Badge className="gap-1 bg-primary/10 text-primary">
                        <Crown className="h-3 w-3" /> Owner
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Member</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <header className="mb-4 flex items-center gap-2">
          <MailPlus className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Invite member</h2>
            <p className="text-xs text-muted-foreground">Send an invitation by email and choose the role.</p>
          </div>
        </header>
        <Separator className="my-3" />
        <form className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end" onSubmit={handleInvite}>
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
        {!isAdmin && <p className="mt-3 text-xs text-muted-foreground">Only owners can send invitations.</p>}
      </section>
    </div>
  )
}
