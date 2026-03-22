"use client"

import { Box, Boxes, Database, HardDrive, MapPin, Network, Server, Zap } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import type { Deployment, ProvisionedResource } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const KIND_ICON: Record<string, { icon: typeof Server; cls: string }> = {
  compute:    { icon: Server,    cls: "text-blue-500" },
  storage:    { icon: HardDrive, cls: "text-amber-500" },
  serverless: { icon: Zap,       cls: "text-purple-500" },
  database:   { icon: Database,  cls: "text-green-500" },
  network:    { icon: Network,   cls: "text-cyan-500" },
  container:  { icon: Boxes,     cls: "text-orange-500" },
}

type DeploymentCardProps = {
  deployment: Deployment
  resources: ProvisionedResource[]
}

export function DeploymentCard({ deployment, resources }: DeploymentCardProps) {
  const running = resources.filter((r) => r.status.toLowerCase() === "running").length

  // Summarize by kind
  const kindCounts = resources.reduce<Record<string, number>>((acc, r) => {
    const slug = r.resource_type?.kind?.slug ?? "other"
    acc[slug] = (acc[slug] ?? 0) + 1
    return acc
  }, {})

  const kindEntries = Object.entries(kindCounts)

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3 w-full sm:w-60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
          {deployment.name || `deployment-${deployment.id}`}
        </span>
        <StatusBadge type="status" value={deployment.status.toLowerCase()} />
      </div>

      {(deployment.region || deployment.providerId || deployment.provider_id) && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Server className="h-3 w-3" />
          <span className="uppercase font-medium">
            {deployment.providerName ?? (deployment.providerId || deployment.provider_id)}
          </span>
          {deployment.region && (
            <>
              <span className="h-3 w-px bg-border" />
              <MapPin className="h-3 w-3" />
              <span>{deployment.region}</span>
            </>
          )}
        </div>
      )}

      {resources.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/60 italic">No resources provisioned yet</p>
      ) : (
        <>
          {/* Kind summary icons */}
          {kindEntries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {kindEntries.map(([slug, count]) => {
                const cfg = KIND_ICON[slug] ?? { icon: Box, cls: "text-muted-foreground" }
                const Icon = cfg.icon
                return (
                  <div key={slug} className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Icon className={cn("h-3 w-3", cfg.cls)} />
                    <span>{count}</span>
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            {running}/{resources.length} running
          </p>
        </>
      )}
    </div>
  )
}

