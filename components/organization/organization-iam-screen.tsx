"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { membersApi } from "@/lib/api/members"
import type { Member } from "@/lib/api/types"
import { toast } from "sonner"

import { OrganizationIamHeader } from "./organization-iam-header"
import { OrganizationMembersSection } from "./organization-members-section"
import { OrganizationInviteSection } from "./organization-invite-section"

export function OrganizationIamScreen() {
  const { currentOrg, user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Member["role"]>("member")
  const [isInviting, setIsInviting] = useState(false)

  const isAdmin = useMemo(() => {
    const me = members.find((m) => m.userId === user?.id || m.email === user?.email)
    return me?.role === "owner"
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
      <OrganizationIamHeader orgName={currentOrg.name} />

      <OrganizationMembersSection
        members={members}
        isLoading={isLoading}
        isAdmin={isAdmin}
      />

      <OrganizationInviteSection
        inviteEmail={inviteEmail}
        inviteRole={inviteRole}
        setInviteEmail={setInviteEmail}
        setInviteRole={setInviteRole}
        isInviting={isInviting}
        isAdmin={isAdmin}
        onInvite={handleInvite}
      />
    </div>
  )
}
