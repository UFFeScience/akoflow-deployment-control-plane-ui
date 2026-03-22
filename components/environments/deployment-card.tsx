"use client"

import { Server, MapPin, Layers } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import type { Deployment, Instance } from "@/lib/api/types"

function toStatus(value: unknown, fallback = "pending") {
  return typeof value === "string" && value.trim() ? value.toLowerCase() : fallback
}

type ClusterCardProps = {
  deployment: Deployment
  instances: Instance[]
}

export function ClusterCard({ deployment, instances }: ClusterCardProps) {
  const running = instances.filter((i) => toStatus(i.status) === "running").length
  const total = instances.length > 0 ? instances.length : deployment.nodeCount

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 w-full sm:w-60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{deployment.name || deployment.role || "Deployment"}</span>
        <StatusBadge type="status" value={toStatus(deployment.status)} />
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Server className="h-3 w-3" />
        <span className="uppercase font-medium">{deployment.providerName || deployment.providerId}</span>
        <span className="h-3 w-px bg-border" />
        <MapPin className="h-3 w-3" />
        <span>{deployment.region}</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Layers className="h-3 w-3" />
        <span>{deployment.nodeCount} nodes</span>
        <span className="h-3 w-px bg-border" />
        <span>{running}/{total} running</span>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {deployment.instanceType || deployment.instanceTypeId}
      </div>
    </div>
  )
}
