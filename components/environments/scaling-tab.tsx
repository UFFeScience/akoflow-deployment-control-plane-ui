"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { Cluster } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/clusters"
import { toast } from "sonner"
import { ClusterScaleCard } from "./cluster-scale-card"

function normalizeClusterPayload(data: any): Cluster {
  const groups = (data?.instance_groups || data?.instanceGroups || []).map((g: any) => ({
    id: g?.id?.toString?.() ?? g?.id,
    clusterId: g?.cluster_id ?? g?.clusterId,
    instanceTypeId: g?.instance_type_id ?? g?.instanceTypeId,
    instanceTypeName: g?.instance_type_name ?? g?.instanceTypeName ?? g?.instance_type?.name,
    instanceType: g?.instance_type ?? g?.instanceType ?? g?.instance_type_name,
    role: g?.role,
    quantity: g?.quantity ?? 0,
    metadata: g?.metadata ?? g?.metadata_json ?? null,
    createdAt: g?.created_at ?? g?.createdAt,
    updatedAt: g?.updated_at ?? g?.updatedAt,
  }))
  const nodeCount = data?.node_count ?? data?.nodeCount ?? groups.reduce((sum: number, g: any) => sum + (Number(g.quantity) || 0), 0)

  return {
    ...data,
    id: data?.id?.toString?.() ?? data?.id,
    environmentId: data?.environment_id ?? data?.environmentId,
    providerId: data?.provider_id ?? data?.providerId,
    providerName: data?.provider_name ?? data?.providerName,
    region: data?.region,
    role: data?.role,
    nodeCount,
    instanceTypeId: data?.instance_type_id ?? data?.instanceTypeId,
    instanceType: data?.instance_type ?? data?.instanceType,
    status: (data?.status || "").toString().toLowerCase() as Cluster["status"],
    instanceGroups: groups,
    createdAt: data?.created_at ?? data?.createdAt,
    updatedAt: data?.updated_at ?? data?.updatedAt,
  }
}

interface ScalingTabProps {
  clusters: Cluster[]
  onClustersChange: (clusters: Cluster[]) => void
}

export function ScalingTab({ clusters, onClustersChange }: ScalingTabProps) {
  const [savingId, setSavingId] = useState<string | null>(null)

  async function handleScale(clusterId: string, delta: number) {
    const cluster = clusters.find((c) => c.id === clusterId)
    if (!cluster) return
    const nextCount = Math.max(0, cluster.nodeCount + delta)
    const previous = clusters
    const optimistic = previous.map((c) => (c.id === clusterId ? { ...c, nodeCount: nextCount, status: "scaling" as Cluster["status"] } : c))
    onClustersChange(optimistic)
    setSavingId(clusterId)

    try {
      const updated = await clustersApi.scale(clusterId, { nodeCount: nextCount })
      const merged = previous.map((c) => (c.id === clusterId ? { ...c, ...updated } : c))
      onClustersChange(merged)
      toast.success(`Cluster scaled to ${nextCount} nodes`)
    } catch {
      onClustersChange(previous)
      toast.error("Failed to scale cluster")
    } finally {
      setSavingId(null)
    }
  }

  if (clusters.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-xs text-muted-foreground">
        No clusters to scale. Create a cluster first.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {clusters.map((cluster) => (
        <ClusterScaleCard
          key={cluster.id}
          cluster={cluster}
          savingId={savingId}
          onScale={handleScale}
          onGroupScale={async (clusterId: string, groupId: string, delta: number) => {
            const groups = cluster.instanceGroups || []
            const updatedGroups = groups.map((g) => (g.id === groupId ? { ...g, quantity: Math.max(0, (g.quantity ?? 0) + delta) } : g))
            const nextNodeCount = updatedGroups.reduce((sum, g) => sum + (g.quantity ?? 0), 0)

            const optimistic = clusters.map((c) =>
              c.id === clusterId
                ? { ...c, instanceGroups: updatedGroups, nodeCount: nextNodeCount, status: "scaling" as Cluster["status"] }
                : c
            )
            onClustersChange(optimistic)
            setSavingId(clusterId)

            try {
              const updated = await clustersApi.updateNodes(clusterId, {
                instanceGroups: updatedGroups.map((g) => ({ id: g.id, quantity: g.quantity ?? 0 })),
              })
              const normalized = normalizeClusterPayload(updated)
              const merged = clusters.map((c) => (c.id === clusterId ? normalized : c))
              onClustersChange(merged)
              toast.success("Cluster nodes updated")
            } catch {
              onClustersChange(clusters)
              toast.error("Failed to update nodes")
            } finally {
              setSavingId(null)
            }
          }}
        />
      ))}
    </div>
  )
}
