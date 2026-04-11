"use client"

import { useState } from "react"
import { CheckCircle2, Clock, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"
import type { AnsibleRun, PlaybookRun, ProvisionedResource, TerraformRun } from "@/lib/api/types"
import type { AnsibleTask, AnsibleTaskStatus } from "@/components/templates/topology-tab/parse-ansible"
import { toast } from "sonner"
import { PhaseIcon } from "./phase-icon"
import { TasksList } from "./tasks-list"
import type { PhaseStatus } from "./phase-status-helpers"

export type { PhaseStatus }
export { terraformPhaseStatus, ansiblePhaseStatus } from "./phase-status-helpers"
export { PhaseConnector } from "./phase-connector"

function phaseLabel(status: PhaseStatus): { label: string; className: string } {
  switch (status) {
    case "running": return { label: "Running",   className: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" }
    case "success": return { label: "Completed", className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" }
    case "error":   return { label: "Failed",    className: "text-red-600 bg-red-50 dark:bg-red-950/40" }
    default:        return { label: "Pending",   className: "text-muted-foreground bg-muted/50" }
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

export interface PhaseCardProps {
  icon: React.ReactNode
  title: string
  description: string
  status: PhaseStatus
  run?: TerraformRun | AnsibleRun | PlaybookRun | null
  extraContent?: React.ReactNode
  resources?: ProvisionedResource[]
  retryLabel?: string
  onRetry?: () => Promise<void>
  tasks?: AnsibleTask[]
  taskStatuses?: Record<string, AnsibleTaskStatus>
}

export function PhaseCard({ icon, title, description, status, run, extraContent, resources = [], retryLabel, onRetry, tasks = [], taskStatuses }: PhaseCardProps) {
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

      {/* Resources (provision phase) */}
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

      {/* Tasks list */}
      {tasks.length > 0 && <TasksList tasks={tasks} taskStatuses={taskStatuses} />}

      {/* Optional extra details (used by Phase 2 playbooks list) */}
      {extraContent}

      {/* Retry */}
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
