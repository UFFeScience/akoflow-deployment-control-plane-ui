"use client"

import { Server, MapPin, Layers } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import type { Cluster, Instance } from "@/lib/api/types"

function toStatus(value: unknown, fallback = "pending") {
  return typeof value === "string" && value.trim() ? value.toLowerCase() : fallback
}

type ClusterCardProps = {
  cluster: Cluster
  instances: Instance[]
}

export function ClusterCard({ cluster, instances }: ClusterCardProps) {
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
