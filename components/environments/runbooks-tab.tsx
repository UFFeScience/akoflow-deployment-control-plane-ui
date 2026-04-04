"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Loader2, Clock, CheckCircle2, XCircle, AlertCircle, BookOpen, RefreshCw, ListChecks, ScrollText } from "lucide-react"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import { environmentsApi } from "@/lib/api/environments"
import type { Deployment, Runbook, RunbookRun } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { RunLogModal } from "@/components/environments/run-log-modal"
import type { RunLogResource } from "@/components/environments/run-log-modal"

interface RunbooksTabProps {
  projectId: string
  environmentId: string
  templateId: string
  versionId: string
  deployments: Deployment[]
}

function statusIcon(status: string) {
  const s = status?.toUpperCase()
  if (s === "COMPLETED") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
  if (s === "FAILED")    return <XCircle className="h-3.5 w-3.5 text-destructive" />
  if (s === "RUNNING" || s === "QUEUED") return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
}

function statusClass(status: string) {
  const s = status?.toUpperCase()
  if (s === "COMPLETED")                 return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  if (s === "FAILED")                    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  if (s === "RUNNING" || s === "QUEUED") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  return "bg-muted text-muted-foreground"
}

interface RunbookCardProps {
  runbook: Runbook
  runs: RunbookRun[]
  onTrigger: (runbookId: string) => Promise<void>
  onViewLogs: (run: RunbookRun) => void
  triggering: boolean
  disabled: boolean
}

function RunbookCard({ runbook, runs, onTrigger, onViewLogs, triggering, disabled }: RunbookCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks className="h-3.5 w-3.5 text-violet-500 shrink-0" />
          <span className="text-sm font-medium">{runbook.name}</span>
          {runbook.description && (
            <span className="text-xs text-muted-foreground">— {runbook.description}</span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5 shrink-0"
          onClick={() => onTrigger(String(runbook.id))}
          disabled={disabled || triggering}
        >
          {triggering ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Run
        </Button>
      </div>

      {runs.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Run history</span>
          <div className="flex flex-col gap-1">
            {runs.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded border border-border/50 bg-muted/30 px-2 py-1.5 text-xs">
                {statusIcon(r.status)}
                <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", statusClass(r.status))}>{r.status}</span>
                {r.created_at && (
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onViewLogs(r)}
                >
                  <ScrollText className="h-3 w-3" />
                  Logs
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {runs.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No runs yet. Click Run to trigger.</p>
      )}
    </div>
  )
}

export function RunbooksTab({ projectId, environmentId, templateId, versionId, deployments }: RunbooksTabProps) {
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [runs, setRuns] = useState<RunbookRun[]>([])
  const [loading, setLoading] = useState(true)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)
  const [logResource, setLogResource] = useState<RunLogResource | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasRunningDeployment = deployments.some((d) => d.status?.toLowerCase() === "running")

  // Full load (shows spinner) — used on mount and manual refresh
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [configs, runsData] = await Promise.all([
        templatesApi.listProviderConfigurations(templateId, versionId).catch(() => []),
        environmentsApi.listRunbookRuns(projectId, environmentId).catch(() => []),
      ])
      const allRunbooks: Runbook[] = []
      for (const cfg of configs) {
        const rb = await templatesApi.listRunbooks(templateId, versionId, cfg.id).catch(() => [])
        allRunbooks.push(...rb)
      }
      setRunbooks(allRunbooks)
      setRuns(runsData)
    } finally {
      setLoading(false)
    }
  }, [templateId, versionId, projectId, environmentId])

  // Silent background poll — only refreshes run statuses, no spinner
  const pollRuns = useCallback(async () => {
    const runsData = await environmentsApi.listRunbookRuns(projectId, environmentId).catch(() => null)
    if (runsData) setRuns(runsData)
  }, [projectId, environmentId])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(pollRuns, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [load, pollRuns])

  const handleTrigger = async (runbookId: string) => {
    setTriggeringId(runbookId)
    try {
      const newRun = await environmentsApi.triggerRunbookRun(projectId, environmentId, runbookId)
      // Optimistically prepend the QUEUED run immediately
      setRuns((prev) => [newRun, ...prev])
    } finally {
      setTriggeringId(null)
      // Refresh in background to pick up any immediate status change
      load()
    }
  }

  const handleViewLogs = (run: RunbookRun) => {
    setLogResource({
      type:          "runbook",
      projectId,
      environmentId,
      runId:         String(run.id),
      title:         `Logs — ${run.runbook_name ?? "Runbook"}`,
    })
  }

  const runsByRunbook = (runbookId: string) =>
    runs
      .filter((r) => String(r.runbook_id) === runbookId)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Runbooks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            On-demand playbooks available for this environment.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>

      {!hasRunningDeployment && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            <strong>Runbooks are disabled.</strong> At least one deployment must be in the{" "}
            <strong>Running</strong> state before you can execute a runbook.
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : runbooks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <BookOpen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No runbooks configured for this template.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {runbooks.map((rb) => (
            <RunbookCard
              key={rb.id}
              runbook={rb}
              runs={runsByRunbook(String(rb.id))}
              onTrigger={handleTrigger}
              onViewLogs={handleViewLogs}
              triggering={triggeringId === String(rb.id)}
              disabled={!hasRunningDeployment}
            />
          ))}
        </div>
      )}

      <RunLogModal
        open={logResource !== null}
        onClose={() => setLogResource(null)}
        resource={logResource}
      />
    </div>
  )
}
