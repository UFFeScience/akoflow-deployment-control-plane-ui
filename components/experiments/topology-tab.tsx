"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Layers, MapPin, Server } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import type { Cluster, Experiment, Instance } from "@/lib/api/types"

interface TopologyTabProps {
  experiment: Experiment
  clusters: Cluster[]
  instancesByCluster: Record<string, Instance[]>
}

const toStatus = (value: unknown, fallback = "pending") =>
  typeof value === "string" && value.trim() ? value.toLowerCase() : fallback

function ClusterCard({ cluster, instances }: { cluster: Cluster; instances: Instance[] }) {
  const running = instances.filter((i) => toStatus(i.status) === "running").length
  const total = instances.length > 0 ? instances.length : cluster.nodeCount

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 w-full sm:w-60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{cluster.name || cluster.role || "Cluster"}</span>
        <StatusBadge type="status" value={toStatus(cluster.status)} />
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Server className="h-3 w-3" />
        <span className="uppercase font-medium">{cluster.providerName || cluster.providerId}</span>
        <span className="h-3 w-px bg-border" />
        <MapPin className="h-3 w-3" />
        <span>{cluster.region}</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Layers className="h-3 w-3" />
        <span>{cluster.nodeCount} nodes</span>
        <span className="h-3 w-px bg-border" />
        <span>{running}/{total} running</span>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {cluster.instanceType || cluster.instanceTypeId}
      </div>
    </div>
  )
}

export function TopologyTab({ experiment, clusters, instancesByCluster }: TopologyTabProps) {
  const grouped = useMemo(() => {
    const map: Record<string, { label: string; clusters: Cluster[] }> = {}
    clusters.forEach((c) => {
      const key = c.providerId
      if (!map[key]) {
        map[key] = { label: c.providerName || c.providerId, clusters: [] }
      }
      map[key].clusters.push(c)
    })
    return Object.entries(map)
  }, [clusters])

  if (clusters.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-xs text-muted-foreground">
        No clusters provisioned for this experiment yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 px-4 py-2">
          <span className="text-xs font-semibold text-primary">{experiment.name}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {grouped.map(([providerId, group]) => (
          <div key={providerId} className={cn("flex flex-col gap-3 rounded-lg border p-4 bg-muted/20")}>            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{group.label}</span>
              <span className="text-[10px] text-muted-foreground">{group.clusters.length} cluster(s)</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {group.clusters.map((cluster) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  instances={instancesByCluster[cluster.id] || []}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
