"use client"

import { useEffect, useState } from "react"
import { Loader2, Play, RefreshCw, ListChecks, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { environmentsApi } from "@/lib/api/environments"
import { templatesApi } from "@/lib/api/templates"
import type { Runbook, RunbookRun } from "@/lib/api/types"

interface RunbooksStepProps {
  projectId: string
  environmentId: string
  templateId: string
  versionId: string
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
  if (s === "COMPLETED")                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  if (s === "FAILED")                   return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  if (s === "RUNNING" || s === "QUEUED") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  return "bg-muted text-muted-foreground"
}

interface RunbookCardProps {
  runbook: Runbook
  runs: RunbookRun[]
  onTrigger: (runbookId: string) => Promise<void>
  triggering: boolean
}

function RunbookCard({ runbook, runs, onTrigger, triggering }: RunbookCardProps) {
  const lastRun = runs[0] ?? null

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
          disabled={triggering}
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
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${statusClass(r.status)}`}>{r.status}</span>
                {r.created_at && (
                  <span className="text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleString()}</span>
                )}
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

export function RunbooksStep({ projectId, environmentId, templateId, versionId }: RunbooksStepProps) {
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [runs, setRuns] = useState<RunbookRun[]>([])
  const [loading, setLoading] = useState(true)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)

  const load = async () => {
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
  }

  useEffect(() => {
    if (!environmentId || !templateId || !versionId) return
    load()
  }, [environmentId, templateId, versionId]) // eslint-disable-line

  const handleTrigger = async (runbookId: string) => {
    setTriggeringId(runbookId)
    try {
      await environmentsApi.triggerRunbookRun(projectId, environmentId, runbookId)
      await load()
    } finally {
      setTriggeringId(null)
    }
  }

  const runsByRunbook = (runbookId: string) =>
    runs.filter((r) => String(r.runbook_id) === runbookId)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold">Runbooks</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          On-demand playbooks available for this environment. Trigger them manually to perform post-configuration tasks.
        </p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : runbooks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <ListChecks className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
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
              triggering={triggeringId === String(rb.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
