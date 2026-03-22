"use client"

import type { Deployment } from "@/lib/api/types"
import { StatusBadge } from "@/components/status-badge"
import { GroupScaleRow } from "./group-scale-row"
import { SimpleScaleRow } from "./simple-scale-row"

type DeploymentScaleCardProps = {
  deployment: Deployment
  savingId: string | null
  onScale: (deploymentId: string, delta: number) => void
  onGroupScale: (deploymentId: string, groupId: string, delta: number) => void
}

export function DeploymentScaleCard({ deployment, savingId, onScale, onGroupScale }: DeploymentScaleCardProps) {
  const groups = deployment.instanceGroups || []
  const canGroupScale = groups.length > 0

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-foreground">{deployment.name || deployment.role || deployment.id}</span>
        <StatusBadge type="provider" value={deployment.providerName || deployment.providerId} />
        <StatusBadge type="status" value={deployment.status} />
        <span className="text-[11px] text-muted-foreground">{deployment.region}</span>
      </div>

      {canGroupScale ? (
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <GroupScaleRow key={group.id} group={group} saving={savingId === deployment.id} onScale={(gId, d) => onGroupScale(deployment.id, gId, d)} />
          ))}
          <div className="flex items-center justify-end text-[11px] text-muted-foreground px-1">
            Total nodes: <span className="ml-1 font-semibold text-foreground">{groups.reduce((s: number, g: any) => s + (g.quantity ?? 0), 0)}</span>
          </div>
        </div>
      ) : (
        <SimpleScaleRow
          label={deployment.instanceType || deployment.instanceTypeId}
          count={deployment.nodeCount}
          saving={savingId === deployment.id}
          onScale={(delta) => onScale(deployment.id, delta)}
        />
      )}
    </div>
  )
}
