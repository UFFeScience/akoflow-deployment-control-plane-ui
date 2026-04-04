"use client"

import type { Deployment, Environment, ProvisionedResource } from "@/lib/api/types"
import { ProviderGroup } from "./provider-group"

interface DeploymentsTopologyProps {
  environment: Environment
  deployments: Deployment[]
  resourcesByDeployment: Record<string, ProvisionedResource[]>
}

export function DeploymentsTopology({ environment, deployments, resourcesByDeployment }: DeploymentsTopologyProps) {
  const grouped = (() => {
    const map: Record<string, { label: string; deployments: Deployment[] }> = {}
    deployments.forEach((d) => {
      const raw = d as any
      const key = (raw.providerId ?? raw.provider_id ?? "unknown") as string
      if (!map[key]) map[key] = { label: raw.providerName ?? key, deployments: [] }
      map[key].deployments.push(d)
    })
    return Object.entries(map)
  })()

  if (deployments.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-xs text-muted-foreground">
        No deployments provisioned for this environment yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-1 mb-1">
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 px-4 py-2">
          <span className="text-xs font-semibold text-primary">{environment.name}</span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {grouped.map(([providerId, group]) => (
          <ProviderGroup
            key={providerId}
            label={group.label}
            deployments={group.deployments}
            resourcesByDeployment={resourcesByDeployment}
          />
        ))}
      </div>
    </div>
  )
}
