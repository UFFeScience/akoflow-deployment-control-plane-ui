"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { Cluster } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/clusters"
import { toast } from "sonner"

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
      {clusters.map((cluster) => (
        <div key={cluster.id} className="rounded-md border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-foreground">{cluster.name || cluster.role || cluster.id}</span>
            <StatusBadge type="provider" value={cluster.providerName || cluster.providerId} />
            <StatusBadge type="status" value={cluster.status} />
            <span className="text-[11px] text-muted-foreground">{cluster.region}</span>
          </div>
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
        </div>
      ))}
    </div>
  )
}
