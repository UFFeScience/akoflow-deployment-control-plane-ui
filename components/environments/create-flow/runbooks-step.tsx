"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw, ListChecks, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { environmentsApi } from "@/lib/api/environments"
import { templatesApi } from "@/lib/api/templates"
import type { Playbook, PlaybookRun } from "@/lib/api/types"

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
  runbook: Playbook
  runs: PlaybookRun[]
}

function RunbookCard({ runbook, runs }: RunbookCardProps) {
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
        <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Auto · after_provision
        </span>
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
        <p className="text-xs text-muted-foreground italic">No runs yet. Waiting for automatic trigger after provisioning.</p>
      )}
    </div>
  )
}

export function RunbooksStep({ projectId, environmentId, templateId, versionId }: RunbooksStepProps) {
  const [runbooks, setRunbooks] = useState<Playbook[]>([])
  const [runs, setRuns] = useState<PlaybookRun[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [configs, runsData] = await Promise.all([
        templatesApi.listProviderConfigurations(templateId, versionId).catch(() => []),
        environmentsApi.listPlaybookRuns(projectId, environmentId).catch(() => []),
      ])
      const allRunbooks: Playbook[] = []
      for (const cfg of configs) {
        const playbooks = await templatesApi.listPlaybooks(templateId, versionId, cfg.id).catch(() => [])
        allRunbooks.push(...playbooks.filter((p) => p.trigger === "after_provision" && p.enabled !== false))
      }
      const uniqueRunbooks = Array.from(new Map(allRunbooks.map((r) => [String(r.id), r])).values())
      setRunbooks(uniqueRunbooks)
      setRuns(runsData.filter((r) => r.trigger === "after_provision"))
    } finally {
      setLoading(false)
    }
  }, [templateId, versionId, projectId, environmentId])

  useEffect(() => {
    if (!environmentId || !templateId || !versionId) return
    load()
    pollRef.current = setInterval(() => {
      environmentsApi
        .listPlaybookRuns(projectId, environmentId)
        .then((runsData) => setRuns(runsData.filter((r) => r.trigger === "after_provision")))
        .catch(() => {})
    }, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [environmentId, templateId, versionId, load, projectId])

  const runsByRunbook = (runbookId: string) =>
    runs.filter((r) => String(r.playbook_id ?? r.activity_id) === runbookId)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold">Phase 2 — After Provision Playbooks</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          These playbooks are triggered automatically after provisioning completes.
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
          <p className="text-sm text-muted-foreground">No playbooks configured with trigger after_provision for this template.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {runbooks.map((rb) => (
            <RunbookCard
              key={rb.id}
              runbook={rb}
              runs={runsByRunbook(String(rb.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
