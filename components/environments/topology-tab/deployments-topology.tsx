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
      const providerId = raw.providerId ?? raw.provider_id
      
      // Helper to clean a string: reject "null", "undefined", empty, or whitespace
      const cleanStr = (val: any): string => {
        if (!val || typeof val !== "string") return ""
        const trimmed = val.trim()
        if (trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined" || !trimmed) {
          return ""
        }
        return trimmed
      }
      
      // Try to get provider name from multiple sources
      let providerName = cleanStr(raw.providerName ?? raw.provider_name)
      if (!providerName) providerName = cleanStr(raw.provider_type ?? raw.providerType)
      if (!providerName) providerName = cleanStr(raw.provider_slug ?? raw.providerSlug)
      
      const key = (providerId ?? "default") as string
      
      if (!map[key]) {
        let label = providerName
        
        // If still no label, infer from resources
        if (!label && resourcesByDeployment[d.id]) {
          const resources = resourcesByDeployment[d.id] ?? []
          if (resources.length > 0) {
            const firstResource = resources[0]
            // Check if it's a null_resource or local type
            if (firstResource.resource_type?.slug?.includes("null") || 
                firstResource.resource_type?.slug?.includes("local")) {
              label = "LOCAL"
            } else if (firstResource.resource_type?.name) {
              label = cleanStr(firstResource.resource_type.name)
            }
          }
        }
        
        // Final fallback: use provider ID capitalized or default to LOCAL
        if (!label) {
          label = (key && key !== "default") ? key.toUpperCase() : "LOCAL"
        } else {
          label = label.toUpperCase()
        }
        
        map[key] = { label, deployments: [] }
      }
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
