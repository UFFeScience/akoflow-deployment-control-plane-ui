"use client"

import { Box, Boxes, Database, HardDrive, Network, RefreshCw, Server, Zap } from "lucide-react"
import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"
import type { Deployment, ProvisionedResource, ProvisionedResourceType } from "@/lib/api/types"

// ── Kind config ───────────────────────────────────────────────────────────────
type KindConfig = { icon: React.ElementType; label: string; iconClass: string }

const KIND_CONFIG: Record<string, KindConfig> = {
  compute:    { icon: Server,    label: "Compute",    iconClass: "text-blue-500" },
  storage:    { icon: HardDrive, label: "Storage",    iconClass: "text-amber-500" },
  serverless: { icon: Zap,       label: "Serverless", iconClass: "text-purple-500" },
  database:   { icon: Database,  label: "Database",   iconClass: "text-green-500" },
  network:    { icon: Network,   label: "Network",    iconClass: "text-cyan-500" },
  container:  { icon: Boxes,     label: "Container",  iconClass: "text-orange-500" },
}

const KIND_ORDER = Object.keys(KIND_CONFIG)

function getKindConfig(resource: ProvisionedResource): KindConfig {
  const slug = resource.resource_type?.kind?.slug ?? ""
  return (
    KIND_CONFIG[slug] ?? {
      icon: Box,
      label: resource.resource_type?.kind?.name ?? "Other",
      iconClass: "text-muted-foreground",
    }
  )
}

function getTypeName(rt?: ProvisionedResourceType): string {
  return rt?.name ?? rt?.slug ?? "—"
}

// ── Main component ────────────────────────────────────────────────────────────
interface ResourcesTabProps {
  deployments: Deployment[]
  resourcesByDeployment: Record<string, ProvisionedResource[]>
  isLoading?: boolean
  onRefresh?: () => Promise<void>
}

export function ResourcesTab({
  deployments,
  resourcesByDeployment,
  isLoading = false,
  onRefresh,
}: ResourcesTabProps) {
  const allResources = Object.values(resourcesByDeployment).flat()

  // Group resources by kind slug
  const byKind = allResources.reduce<Record<string, ProvisionedResource[]>>((acc, r) => {
    const slug = r.resource_type?.kind?.slug ?? "other"
    ;(acc[slug] = acc[slug] ?? []).push(r)
    return acc
  }, {})

  // Known kinds first, then anything else
  const sortedKinds = [
    ...KIND_ORDER.filter((k) => byKind[k]),
    ...Object.keys(byKind).filter((k) => !KIND_ORDER.includes(k)),
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Provisioned Resources</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allResources.length} resource{allResources.length !== 1 ? "s" : ""} across{" "}
            {deployments.length} deployment{deployments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => onRefresh?.()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("mr-1 h-3 w-3", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && allResources.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-xs text-muted-foreground">
          Loading resources…
        </div>
      )}

      {/* Empty state — deployment exists but no resources yet */}
      {!isLoading && allResources.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <Box className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs font-medium text-muted-foreground">No resources provisioned yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            Resources are created automatically after a successful terraform apply.
          </p>
        </div>
      )}

      {/* Resource groups */}
      {sortedKinds.map((kindSlug) => {
        const resources = byKind[kindSlug] ?? []
        const cfg: KindConfig =
          KIND_CONFIG[kindSlug] ?? {
            icon: Box,
            label: resources[0]?.resource_type?.kind?.name ?? "Other",
            iconClass: "text-muted-foreground",
          }

        return (
          <div key={kindSlug} className="rounded-lg border border-border overflow-hidden">
            {/* Group header */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
              <cfg.icon className={cn("h-3.5 w-3.5 shrink-0", cfg.iconClass)} />
              <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {resources.length}
              </Badge>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {resources.map((resource) => (
                <ResourceRow key={resource.id} resource={resource} cfg={cfg} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Resource row ──────────────────────────────────────────────────────────────
function ResourceRow({
  resource,
  cfg,
}: {
  resource: ProvisionedResource
  cfg: KindConfig
}) {
  const Icon = cfg.icon
  const status = resource.status.toLowerCase()
  const hasIps = resource.public_ip || resource.private_ip
  const displayName =
    resource.name || resource.provider_resource_id || `resource-${resource.id}`

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-muted/20 transition-colors">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.iconClass)} />

      {/* Name + type */}
      <div className="min-w-0 flex-1">
        <span className="font-medium text-foreground">{displayName}</span>
        <span className="ml-2 text-[11px] text-muted-foreground">
          {getTypeName(resource.resource_type)}
        </span>
      </div>

      {/* IPs — hidden on small screens */}
      {hasIps && (
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          {resource.public_ip && <span title="Public IP">{resource.public_ip}</span>}
          {resource.public_ip && resource.private_ip && (
            <span className="text-border">→</span>
          )}
          {resource.private_ip && <span title="Private IP">{resource.private_ip}</span>}
        </div>
      )}

      {/* Provider resource ID — hidden on medium screens */}
      {resource.provider_resource_id && (
        <span
          className="hidden md:block max-w-[120px] truncate font-mono text-[11px] text-muted-foreground/60"
          title={resource.provider_resource_id}
        >
          {resource.provider_resource_id}
        </span>
      )}

      <StatusBadge type="status" value={status} />
    </div>
  )
}
