"use client"

import type { Cluster } from "@/lib/api/types"
import { StatusBadge } from "@/components/status-badge"
import { GroupScaleRow } from "./group-scale-row"
import { SimpleScaleRow } from "./simple-scale-row"

type ClusterScaleCardProps = {
  cluster: Cluster
  savingId: string | null
  onScale: (clusterId: string, delta: number) => void
  onGroupScale: (clusterId: string, groupId: string, delta: number) => void
}

export function ClusterScaleCard({ cluster, savingId, onScale, onGroupScale }: ClusterScaleCardProps) {
  const groups = cluster.instanceGroups || []
  const canGroupScale = groups.length > 0

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-foreground">{cluster.name || cluster.role || cluster.id}</span>
        <StatusBadge type="provider" value={cluster.providerName || cluster.providerId} />
        <StatusBadge type="status" value={cluster.status} />
        <span className="text-[11px] text-muted-foreground">{cluster.region}</span>
      </div>

      {canGroupScale ? (
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <GroupScaleRow key={group.id} group={group} saving={savingId === cluster.id} onScale={(gId, d) => onGroupScale(cluster.id, gId, d)} />
          ))}
          <div className="flex items-center justify-end text-[11px] text-muted-foreground px-1">
            Total nodes: <span className="ml-1 font-semibold text-foreground">{groups.reduce((s: number, g: any) => s + (g.quantity ?? 0), 0)}</span>
          </div>
        </div>
      ) : (
        <SimpleScaleRow
          label={cluster.instanceType || cluster.instanceTypeId}
          count={cluster.nodeCount}
          saving={savingId === cluster.id}
          onScale={(delta) => onScale(cluster.id, delta)}
        />
      )}
    </div>
  )
}
