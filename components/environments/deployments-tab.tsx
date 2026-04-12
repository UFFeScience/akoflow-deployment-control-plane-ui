"use client"

import { useState } from "react"
import { Loader2, Plus, RefreshCw, Server, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { CreateDeploymentDialog } from "./create-deployment-dialog"
import { DeploymentPhasePipeline } from "@/components/environments/deployment-phase-pipeline"
import type { Deployment, Environment, ProvisionedResource } from "@/lib/api/types"
import { deploymentsApi } from "@/lib/api/deployments"
import { environmentsApi } from "@/lib/api/environments"
import { toast } from "sonner"

interface DeploymentsTabProps {
  environmentId: string
  projectId?: string
  environment?: Environment | null
  deployments: Deployment[]
  resourcesByDeployment?: Record<string, ProvisionedResource[]>
  isLoading?: boolean
  onDeploymentsChange: (deployments: Deployment[]) => void
  onRefresh?: () => Promise<void>
  onOpenActivitiesTab?: () => void
}

export function DeploymentsTab({
  environmentId,
  projectId = "",
  environment = null,
  deployments,
  resourcesByDeployment = {},
  isLoading = false,
  onDeploymentsChange,
  onRefresh,
  onOpenActivitiesTab,
}: DeploymentsTabProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isDestroying, setIsDestroying] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  async function handleDestroy(deploymentId: string) {
    setIsDestroying(true)
    try {
      await deploymentsApi.destroy(deploymentId)
      onDeploymentsChange(deployments.filter((d) => d.id !== deploymentId))
      await onRefresh?.()
      toast.success("Deployment destroyed")
    } catch {
      toast.error("Failed to destroy deployment")
    } finally {
      setIsDestroying(false)
      setConfirmId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Deployments ({deployments.length})</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onRefresh?.()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Refresh
          </Button>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-3 w-3" />
          New Deployment
        </Button>
      </div>

      {deployments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
          {isLoading ? "Loading deployments…" : "No deployments yet. Create one to start provisioning."}
        </div>
      ) : (
        deployments.map((deployment) => {
          const resources = resourcesByDeployment[deployment.id] ?? []

          return (
            <div key={deployment.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">

              {/* Header row */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {deployment.name || `Deployment #${deployment.id}`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(deployment.provider_credentials ?? []).map((cred) => (
                      <StatusBadge
                        key={cred.id}
                        type="provider"
                        value={(cred.provider_slug ?? cred.provider_id ?? "").toLowerCase()}
                      />
                    ))}
                    {deployment.region && (
                      <span className="text-[11px] text-muted-foreground">{deployment.region}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge type="status" value={deployment.status.toLowerCase()} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmId(deployment.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Destroy
                  </Button>
                </div>
              </div>

              {/* Phase pipeline */}
              <DeploymentPhasePipeline
                projectId={projectId}
                environmentId={environmentId}
                deployment={deployment}
                templateVersionId={
                  environment?.environment_template_version_id ??
                  (environment as any)?.environmentTemplateVersionId ??
                  null
                }
                resources={resources}
                onOpenActivitiesTab={onOpenActivitiesTab}
              />

              {/* Resource summary footer */}
              {resources.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                  <Server className="h-3 w-3" />
                  <span>{resources.length} resource{resources.length !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{resources.filter((r) => r.status.toUpperCase() === "RUNNING").length} running</span>
                  {resources.some((r) => r.public_ip) && (() => {
                    const ips = resources.filter((r) => r.public_ip)
                    const visible = ips.slice(0, 4)
                    const overflow = ips.length - visible.length
                    return (
                      <>
                        <span>·</span>
                        {visible.map((r) => (
                          <Badge key={r.id} variant="secondary" className="h-4 px-1.5 text-[10px] font-mono">
                            {r.public_ip}
                          </Badge>
                        ))}
                        {overflow > 0 && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                            +{overflow} more
                          </Badge>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })
      )}

      <ConfirmationDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDestroy(confirmId)}
        title="Destroy deployment?"
        description="This will run terraform destroy and remove all provisioned resources under this deployment."
        confirmLabel="Destroy"
        loading={isDestroying}
      />

      <CreateDeploymentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        environmentId={environmentId}
        environment={environment}
        existingDeployments={deployments}
        onSuccess={async () => { await onRefresh?.() }}
      />
    </div>
  )
}
