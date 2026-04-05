"use client"

import type { Deployment, ProvisionedResource } from "@/lib/api/types"
import { DeploymentCard } from "../deployment-card"

interface ProviderGroupProps {
  label: string
  deployments: Deployment[]
  resourcesByDeployment: Record<string, ProvisionedResource[]>
}

export function ProviderGroup({ label, deployments, resourcesByDeployment }: ProviderGroupProps) {
  // Sanitize label to never show "null", "undefined", string literals, or empty values
  const sanitizedLabel = (() => {
    if (!label || typeof label !== "string") return "LOCAL"
    const trimmed = label.trim()
    if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
      return "LOCAL"
    }
    return trimmed
  })()
  
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {sanitizedLabel}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {deployments.length} deployment{deployments.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {deployments.map((deployment) => (
          <DeploymentCard
            key={deployment.id}
            deployment={deployment}
            resources={resourcesByDeployment[deployment.id] ?? []}
          />
        ))}
      </div>
    </div>
  )
}
