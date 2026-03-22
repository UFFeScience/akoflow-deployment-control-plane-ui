"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { Deployment, Environment, ProvisionedResource } from "@/lib/api/types"
import { DeploymentCard } from "./deployment-card"

interface TopologyTabProps {
  environment: Environment
  deployments: Deployment[]
  resourcesByDeployment: Record<string, ProvisionedResource[]>
}

export function TopologyTab({ environment, deployments, resourcesByDeployment }: TopologyTabProps) {
  // Group deployments by provider
  const grouped = useMemo(() => {
    const map: Record<string, { label: string; deployments: Deployment[] }> = {}
    deployments.forEach((d) => {
      const key = (d.providerId ?? d.provider_id ?? "unknown") as string
      if (!map[key]) map[key] = { label: d.providerName ?? key, deployments: [] }
      map[key].deployments.push(d)
    })
    return Object.entries(map)
  }, [deployments])

  if (deployments.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-xs text-muted-foreground">
        No deployments provisioned for this environment yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Environment node */}
      <div className="flex flex-col items-center gap-1">
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 px-4 py-2">
          <span className="text-xs font-semibold text-primary">{environment.name}</span>
        </div>
      </div>

      {/* Provider groups */}
      <div className="grid gap-4 lg:grid-cols-2">
        {grouped.map(([providerId, group]) => (
          <div
            key={providerId}
            className={cn("flex flex-col gap-3 rounded-lg border p-4 bg-muted/20")}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {group.deployments.length} deployment{group.deployments.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {group.deployments.map((deployment) => (
                <DeploymentCard
                  key={deployment.id}
                  deployment={deployment}
                  resources={resourcesByDeployment[deployment.id] ?? []}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
