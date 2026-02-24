"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { Cluster, Experiment, Instance } from "@/lib/api/types"
import { ClusterCard } from "./cluster-card"

interface TopologyTabProps {
  experiment: Experiment
  clusters: Cluster[]
  instancesByCluster: Record<string, Instance[]>
}

const toStatus = (value: unknown, fallback = "pending") =>
  typeof value === "string" && value.trim() ? value.toLowerCase() : fallback

/* ClusterCard extracted to components/experiments/cluster-card.tsx */

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
