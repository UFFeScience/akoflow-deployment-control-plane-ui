"use client"

import { Shield } from "lucide-react"

type OrganizationIamHeaderProps = {
  orgName: string
}

export function OrganizationIamHeader({ orgName }: OrganizationIamHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
        <h1 className="text-lg font-semibold text-foreground">IAM & Access</h1>
        <p className="text-sm text-muted-foreground">Manage members, invitations, and roles for {orgName}.</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">Owners can manage access; members have read-only view.</span>
      </div>
    </div>
  )
}
