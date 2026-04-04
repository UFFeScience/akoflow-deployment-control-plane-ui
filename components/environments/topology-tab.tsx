"use client"

import { Layers } from "lucide-react"
import type { Deployment, Environment, ProvisionedResource } from "@/lib/api/types"
import { DeploymentsTopology } from "./topology-tab/deployments-topology"
import { TemplateGraph } from "./topology-tab/template-graph"

interface TopologyTabProps {
  environment: Environment
  deployments: Deployment[]
  resourcesByDeployment: Record<string, ProvisionedResource[]>
}

export function TopologyTab({ environment, deployments, resourcesByDeployment }: TopologyTabProps) {
  const templateVersionId =
    (environment as any).environment_template_version_id ??
    (environment as any).environmentTemplateVersionId ?? null
  const templateId =
    (environment as any).templateId ??
    (environment as any).template_id ?? null

  return (
    <div className="flex flex-col gap-6">
      {/* Deployments */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Deployments</span>
          {deployments.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {deployments.length}
            </span>
          )}
        </div>
        <DeploymentsTopology
          environment={environment}
          deployments={deployments}
          resourcesByDeployment={resourcesByDeployment}
        />
      </div>

      {/* Infrastructure Topology */}
      {templateId && templateVersionId && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Infrastructure Topology</span>
          </div>
          <TemplateGraph
            templateId={String(templateId)}
            templateVersionId={String(templateVersionId)}
          />
        </div>
      )}
    </div>
  )
}
