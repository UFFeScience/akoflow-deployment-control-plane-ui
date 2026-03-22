"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { Deployment } from "@/lib/api/types"
import { deploymentsApi } from "@/lib/api/deployments"
import { toast } from "sonner"
import { DeploymentScaleCard } from "./deployment-scale-card"

function normalizeDeploymentPayload(data: any): Deployment {
  const groups = (data?.instance_groups || data?.instanceGroups || []).map((g: any) => ({
    id: g?.id?.toString?.() ?? g?.id,
    deploymentId: g?.deployment_id ?? g?.deploymentId,
    instanceTypeId: g?.instance_type_id ?? g?.instanceTypeId,
    instanceTypeName: g?.instance_type_name ?? g?.instanceTypeName ?? g?.instance_type?.name,
    instanceType: g?.instance_type ?? g?.instanceType ?? g?.instance_type_name,
    role: g?.role,
    quantity: g?.quantity ?? 0,
    metadata: g?.metadata ?? g?.metadata_json ?? null,
    createdAt: g?.created_at ?? g?.createdAt,
    updatedAt: g?.updated_at ?? g?.updatedAt,
  }))
  const nodeCount = data?.node_count ?? data?.nodeCount ?? groups.reduce((sum: number, g: any) => sum + (Number(g.quantity) || 0), 0)

  return {
    ...data,
    id: data?.id?.toString?.() ?? data?.id,
    environmentId: data?.environment_id ?? data?.environmentId,
    providerId: data?.provider_id ?? data?.providerId,
    providerName: data?.provider_name ?? data?.providerName,
    region: data?.region,
    role: data?.role,
    nodeCount,
    instanceTypeId: data?.instance_type_id ?? data?.instanceTypeId,
    instanceType: data?.instance_type ?? data?.instanceType,
    status: (data?.status || "").toString().toLowerCase() as Deployment["status"],
    instanceGroups: groups,
    createdAt: data?.created_at ?? data?.createdAt,
    updatedAt: data?.updated_at ?? data?.updatedAt,
  }
}

interface ScalingTabProps {
  deployments: Deployment[]
  onDeploymentsChange: (deployments: Deployment[]) => void
}

export function ScalingTab({ deployments, onDeploymentsChange }: ScalingTabProps) {
  const [savingId, setSavingId] = useState<string | null>(null)

  async function handleScale(deploymentId: string, delta: number) {
    const deployment = deployments.find((c) => c.id === deploymentId)
    if (!deployment) return
    const nextCount = Math.max(0, deployment.nodeCount + delta)
    const previous = deployments
    const optimistic = previous.map((c) => (c.id === deploymentId ? { ...c, nodeCount: nextCount, status: "scaling" as Deployment["status"] } : c))
    onDeploymentsChange(optimistic)
    setSavingId(deploymentId)

    try {
      const updated = await deploymentsApi.scale(deploymentId, { nodeCount: nextCount })
      const merged = previous.map((c) => (c.id === deploymentId ? { ...c, ...updated } : c))
      onDeploymentsChange(merged)
      toast.success(`Deployment scaled to ${nextCount} nodes`)
    } catch {
      onDeploymentsChange(previous)
      toast.error("Failed to scale deployment")
    } finally {
      setSavingId(null)
    }
  }

  if (deployments.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-xs text-muted-foreground">
        No deployments to scale. Create a deployment first.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {deployments.map((deployment) => (
        <DeploymentScaleCard
          key={deployment.id}
          deployment={deployment}
          savingId={savingId}
          onScale={handleScale}
          onGroupScale={async (deploymentId: string, groupId: string, delta: number) => {
            const groups = deployment.instanceGroups || []
            const updatedGroups = groups.map((g) => (g.id === groupId ? { ...g, quantity: Math.max(0, (g.quantity ?? 0) + delta) } : g))
            const nextNodeCount = updatedGroups.reduce((sum, g) => sum + (g.quantity ?? 0), 0)

            const optimistic = deployments.map((c) =>
              c.id === deploymentId
                ? { ...c, instanceGroups: updatedGroups, nodeCount: nextNodeCount, status: "scaling" as Deployment["status"] }
                : c
            )
            onDeploymentsChange(optimistic)
            setSavingId(deploymentId)

            try {
              const updated = await deploymentsApi.updateNodes(deploymentId, {
                instanceGroups: updatedGroups.map((g) => ({ id: g.id, quantity: g.quantity ?? 0 })),
              })
              const normalized = normalizeDeploymentPayload(updated)
              const merged = deployments.map((c) => (c.id === deploymentId ? normalized : c))
              onDeploymentsChange(merged)
              toast.success("Deployment nodes updated")
            } catch {
              onDeploymentsChange(deployments)
              toast.error("Failed to update nodes")
            } finally {
              setSavingId(null)
            }
          }}
        />
      ))}
    </div>
  )
}
