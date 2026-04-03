"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  Settings2,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { CreateDeploymentDialog } from "./create-deployment-dialog"
import type { AnsibleRun, Deployment, Environment, ProvisionedResource, TerraformRun } from "@/lib/api/types"
import { deploymentsApi } from "@/lib/api/deployments"
import { environmentsApi } from "@/lib/api/environments"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Phase status helpers ───────────────────────────────────────────────────────

type PhaseStatus = "idle" | "running" | "success" | "error"

function terraformPhaseStatus(deploymentStatus: string, tfRun?: TerraformRun | null): PhaseStatus {
  const ds = deploymentStatus.toLowerCase()

  if (tfRun) {
    const s = tfRun.status.toLowerCase()
    if (s === "applied") return "success"
    if (s === "failed")  return "error"
    if (["initializing", "planning", "applying"].includes(s)) return "running"
  }

  if (ds === "provisioning") return "running"
  if (ds === "configuring" || ds === "running") return "success"
  if (ds === "error") {
    // Only "error" if terraform run itself failed (or no run at all = never started)
    if (!tfRun || tfRun.status.toLowerCase() === "failed") return "error"
    return "success"
  }
  return "idle"
}

function ansiblePhaseStatus(deploymentStatus: string, ansibleRun?: AnsibleRun | null): PhaseStatus {
  const ds = deploymentStatus.toLowerCase()

  if (ansibleRun) {
    const s = ansibleRun.status.toLowerCase()
    if (s === "completed") return "success"
    if (s === "failed")    return "error"
    if (["initializing", "running"].includes(s)) return "running"
  }

  if (ds === "configuring") return "running"
  if (ds === "running")     return "success"
  if (ds === "error") {
    // If terraform succeeded but ansible run failed (or doesn't exist), mark ansible as error
    if (ansibleRun && ansibleRun.status.toLowerCase() === "failed") return "error"
    return "idle"
  }
  return "idle"
}

function PhaseIcon({ status }: { status: PhaseStatus }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === "error")   return <AlertTriangle className="h-4 w-4 text-red-500" />
  return <Circle className="h-4 w-4 text-muted-foreground/40" />
}

function phaseLabel(status: PhaseStatus): { label: string; className: string } {
  switch (status) {
    case "running": return { label: "Running",  className: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" }
    case "success": return { label: "Completed", className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" }
    case "error":   return { label: "Failed",   className: "text-red-600 bg-red-50 dark:bg-red-950/40" }
    default:        return { label: "Pending",  className: "text-muted-foreground bg-muted/50" }
  }
}

function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Phase card ────────────────────────────────────────────────────────────────

interface PhaseCardProps {
  icon: React.ReactNode
  title: string
  description: string
  status: PhaseStatus
  run?: TerraformRun | AnsibleRun | null
  resources?: ProvisionedResource[]
  retryLabel?: string
  onRetry?: () => Promise<void>
}

function PhaseCard({ icon, title, description, status, run, resources = [], retryLabel, onRetry }: PhaseCardProps) {
  const [retrying, setRetrying] = useState(false)
  const badge = phaseLabel(status)

  async function handleRetry() {
    if (!onRetry) return
    setRetrying(true)
    try {
      await onRetry()
      toast.success(`${title} job queued`)
    } catch {
      toast.error(`Failed to queue ${title.toLowerCase()}`)
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 transition-colors",
        status === "running" && "border-blue-200 dark:border-blue-800",
        status === "error"   && "border-red-200 dark:border-red-800",
        status === "success" && "border-emerald-200 dark:border-emerald-800",
        status === "idle"    && "border-border",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <div>
            <p className="text-xs font-semibold text-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <PhaseIcon status={status} />
          <span className={cn("text-[10px] font-medium rounded px-1.5 py-0.5", badge.className)}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Run metadata */}
      {run && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {run.started_at && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Started {formatRelative(run.started_at)}
            </span>
          )}
          {run.finished_at && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Finished {formatRelative(run.finished_at)}
            </span>
          )}
          {run.provider_type && (
            <span className="uppercase font-mono text-[10px] opacity-70">{run.provider_type}</span>
          )}
        </div>
      )}

      {/* Resources (for provision phase) */}
      {resources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px]"
            >
              <span className="font-medium">{r.name ?? r.provider_resource_id ?? `resource-${r.id}`}</span>
              {r.public_ip && (
                <span className="text-muted-foreground font-mono">{r.public_ip}</span>
              )}
              <StatusBadge type="status" value={(r.status ?? "").toLowerCase()} />
            </div>
          ))}
        </div>
      )}

      {/* Retry action */}
      {status === "error" && onRetry && (
        <div className="pt-1 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
            onClick={handleRetry}
            disabled={retrying}
          >
            {retrying ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 h-3 w-3" />
            )}
            {retryLabel ?? `Retry ${title}`}
          </Button>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            The previous run failed. Retrying will queue a new job.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface DeploymentsTabProps {
  environmentId: string
  projectId?: string
  environment?: Environment | null
  deployments: Deployment[]
  resourcesByDeployment?: Record<string, ProvisionedResource[]>
  isLoading?: boolean
  onDeploymentsChange: (deployments: Deployment[]) => void
  onRefresh?: () => Promise<void>
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
}: DeploymentsTabProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isDestroying, setIsDestroying] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [tfRuns, setTfRuns]           = useState<TerraformRun[]>([])
  const [ansibleRuns, setAnsibleRuns] = useState<AnsibleRun[]>([])

  useEffect(() => {
    if (!projectId || !environmentId) return
    environmentsApi.listTerraformRuns(projectId, environmentId).then(setTfRuns).catch(() => {})
    environmentsApi.listAnsibleRuns(projectId, environmentId).then(setAnsibleRuns).catch(() => {})
  }, [projectId, environmentId, deployments])

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

  // Latest run for each phase (backend returns newest-first)
  const latestTf      = tfRuns[0] ?? null
  const latestAnsible = ansibleRuns[0] ?? null

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Deployments ({deployments.length})</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onRefresh?.()} disabled={isLoading}>
            <RefreshCw className="mr-1 h-3 w-3" />
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
          const resources   = resourcesByDeployment[deployment.id] ?? []
          const tfStatus    = terraformPhaseStatus(deployment.status, latestTf)
          const ansStatus   = ansiblePhaseStatus(deployment.status, latestAnsible)

          return (
            <div key={deployment.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">

              {/* Deployment header row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
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
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                {/* Phase 1 – Provision */}
                <PhaseCard
                  icon={<Server className="h-4 w-4" />}
                  title="Phase 1 — Provision"
                  description="Terraform creates the infrastructure (VMs, networks, security groups)"
                  status={tfStatus}
                  run={latestTf}
                  resources={resources}
                  retryLabel="Retry Provision"
                  onRetry={
                    tfStatus === "error"
                      ? () => environmentsApi.retryProvision(projectId, environmentId, deployment.id).then(() => onRefresh?.())
                      : undefined
                  }
                />

                {/* Connector */}
                <div className="flex items-center justify-center self-center mt-2">
                  <ChevronRight
                    className={cn(
                      "h-5 w-5",
                      tfStatus === "success" ? "text-emerald-400" : "text-muted-foreground/30",
                    )}
                  />
                </div>

                {/* Phase 2 – Configure */}
                <PhaseCard
                  icon={<Settings2 className="h-4 w-4" />}
                  title="Phase 2 — Configure"
                  description="Ansible installs software and configures the provisioned instances"
                  status={ansStatus}
                  run={latestAnsible}
                  retryLabel="Retry Configure"
                  onRetry={
                    ansStatus === "error"
                      ? () => environmentsApi.retryConfigure(projectId, environmentId, deployment.id).then(() => onRefresh?.())
                      : undefined
                  }
                />
              </div>

              {/* Resource summary footer */}
              {resources.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                  <Server className="h-3 w-3" />
                  <span>{resources.length} resource{resources.length !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{resources.filter((r) => r.status.toUpperCase() === "RUNNING").length} running</span>
                  {resources.some((r) => r.public_ip) && (
                    <>
                      <span>·</span>
                      {resources.filter((r) => r.public_ip).map((r) => (
                        <Badge key={r.id} variant="secondary" className="h-4 px-1.5 text-[10px] font-mono">
                          {r.public_ip}
                        </Badge>
                      ))}
                    </>
                  )}
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

