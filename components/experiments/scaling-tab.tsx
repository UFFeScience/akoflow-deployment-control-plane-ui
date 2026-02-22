"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { Cluster } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/clusters"
import { toast } from "sonner"

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
    experimentId: data?.experiment_id ?? data?.experimentId,
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

  async function handleScale(cluster: Cluster, delta: number) {
    const nextCount = Math.max(0, cluster.nodeCount + delta)
    const previous = clusters
    const optimistic = previous.map((c) =>
      c.id === cluster.id ? { ...c, nodeCount: nextCount, status: "scaling" as Cluster["status"] } : c
    )
    onClustersChange(optimistic)
    setSavingId(cluster.id)

    try {
      const updated = await clustersApi.scale(cluster.id, { nodeCount: nextCount })
      const merged = previous.map((c) => (c.id === cluster.id ? { ...c, ...updated } : c))
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
      {clusters.map((cluster) => {
        const groups = cluster.instanceGroups || []
        const canGroupScale = groups.length > 0

        async function handleGroupScale(groupId: string, delta: number) {
          const updatedGroups = groups.map((g) =>
            g.id === groupId ? { ...g, quantity: Math.max(0, (g.quantity ?? 0) + delta) } : g
          )
          const nextNodeCount = updatedGroups.reduce((sum, g) => sum + (g.quantity ?? 0), 0)

          const optimistic = clusters.map((c) =>
            c.id === cluster.id
              ? {
                  ...c,
                  instanceGroups: updatedGroups,
                  nodeCount: nextNodeCount,
                  status: "scaling" as Cluster["status"],
                }
              : c
          )
          onClustersChange(optimistic)
          setSavingId(cluster.id)

          try {
            const updated = await clustersApi.updateNodes(cluster.id, {
              instanceGroups: updatedGroups.map((g) => ({ id: g.id, quantity: g.quantity ?? 0 })),
            })
            const normalized = normalizeClusterPayload(updated)
            const merged = clusters.map((c) => (c.id === cluster.id ? normalized : c))
            onClustersChange(merged)
            toast.success("Cluster nodes updated")
          } catch {
            onClustersChange(clusters)
            toast.error("Failed to update nodes")
          } finally {
            setSavingId(null)
          }
        }

        return (
          <div key={cluster.id} className="rounded-md border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-foreground">{cluster.name || cluster.role || cluster.id}</span>
              <StatusBadge type="provider" value={cluster.providerName || cluster.providerId} />
              <StatusBadge type="status" value={cluster.status} />
              <span className="text-[11px] text-muted-foreground">{cluster.region}</span>
            </div>

            {canGroupScale ? (
              <div className="flex flex-col gap-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between rounded bg-muted/30 px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-foreground font-medium">{group.role || "group"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {group.instanceTypeName || group.instanceType || group.instanceTypeId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleGroupScale(group.id, -1)}
                        disabled={savingId === cluster.id || (group.quantity ?? 0) <= 0}
                      >
                        <Minus className="h-3 w-3" />
                        <span className="sr-only">Scale down group</span>
                      </Button>
                      <span className="w-10 text-center text-xs font-bold text-foreground">{group.quantity ?? 0}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleGroupScale(group.id, 1)}
                        disabled={savingId === cluster.id}
                      >
                        <Plus className="h-3 w-3" />
                        <span className="sr-only">Scale up group</span>
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-end text-[11px] text-muted-foreground px-1">
                  Total nodes: <span className="ml-1 font-semibold text-foreground">{groups.reduce((s, g) => s + (g.quantity ?? 0), 0)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded bg-muted/30 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">{cluster.instanceType || cluster.instanceTypeId}</div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleScale(cluster, -1)}
                    disabled={savingId === cluster.id || cluster.nodeCount <= 0}
                  >
                    <Minus className="h-3 w-3" />
                    <span className="sr-only">Scale down</span>
                  </Button>
                  <span className="w-10 text-center text-xs font-bold text-foreground">{cluster.nodeCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleScale(cluster, 1)}
                    disabled={savingId === cluster.id}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="sr-only">Scale up</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
