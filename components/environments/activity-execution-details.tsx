"use client"

import { useMemo, useState } from "react"
import type { ActivityRun, PlaybookRunTaskHostStatus } from "@/lib/api/types"

interface ActivityExecutionDetailsProps {
  runs: ActivityRun[]
}

function getRunRecencyMs(run: ActivityRun): number {
  const timestamp = run.updated_at ?? run.finished_at ?? run.started_at ?? run.created_at
  if (!timestamp) return 0
  const ms = Date.parse(timestamp)
  return Number.isNaN(ms) ? 0 : ms
}

function statusClass(status: string) {
  const s = (status ?? "").toUpperCase()
  if (s === "COMPLETED" || s === "OK" || s === "CHANGED") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  if (s === "FAILED" || s === "UNREACHABLE") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  if (s === "RUNNING" || s === "QUEUED" || s === "INITIALIZING") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  return "bg-muted text-muted-foreground"
}

export function ActivityExecutionDetails({ runs }: ActivityExecutionDetailsProps) {
  const [detailsRunId, setDetailsRunId] = useState<string>("latest")
  const [detailsViewMode, setDetailsViewMode] = useState<"activity" | "host">("activity")
  const [selectedActivity, setSelectedActivity] = useState<string>("all")

  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => {
      const diff = getRunRecencyMs(b) - getRunRecencyMs(a)
      if (diff !== 0) return diff
      return String(b.id).localeCompare(String(a.id))
    }),
    [runs],
  )

  const selectedRun = useMemo(() => {
    if (sortedRuns.length === 0) return null
    if (detailsRunId === "latest") return sortedRuns[0]
    return sortedRuns.find((r) => String(r.id) === detailsRunId) ?? sortedRuns[0]
  }, [sortedRuns, detailsRunId])

  const selectedRunRows = useMemo(
    () => ((selectedRun?.task_host_statuses ?? []) as PlaybookRunTaskHostStatus[]).slice(),
    [selectedRun],
  )

  const groupedByTask = useMemo(
    () => selectedRunRows.reduce<Record<string, PlaybookRunTaskHostStatus[]>>((acc, row) => {
      const key = row.task_name || "Unnamed task"
      if (!acc[key]) acc[key] = []
      acc[key].push(row)
      return acc
    }, {}),
    [selectedRunRows],
  )

  const groupedByHost = useMemo(
    () => selectedRunRows.reduce<Record<string, PlaybookRunTaskHostStatus[]>>((acc, row) => {
      const key = row.host || "unknown"
      if (!acc[key]) acc[key] = []
      acc[key].push(row)
      return acc
    }, {}),
    [selectedRunRows],
  )

  const activityOptions = useMemo(
    () => Object.keys(groupedByTask).sort((a, b) => a.localeCompare(b)),
    [groupedByTask],
  )

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Detailed execution</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Task and host status grouped per selected run.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={detailsRunId}
            onChange={(e) => setDetailsRunId(e.target.value)}
            className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
          >
            <option value="latest">Latest run</option>
            {sortedRuns.map((run) => (
              <option key={run.id} value={String(run.id)}>
                {(run.playbook_name ?? run.activity_name ?? "Playbook")} · {(run.updated_at ?? run.created_at)
                  ? new Date((run.updated_at ?? run.created_at) as string).toLocaleString()
                  : run.id}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded border border-border/70 bg-background/70 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setDetailsViewMode("activity")}
              className={`rounded px-2 py-1 ${detailsViewMode === "activity" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              By activity
            </button>
            <button
              type="button"
              onClick={() => setDetailsViewMode("host")}
              className={`rounded px-2 py-1 ${detailsViewMode === "host" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              By host
            </button>
          </div>

          {detailsViewMode === "activity" && (
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
            >
              <option value="all">All activities</option>
              {activityOptions.map((taskName) => (
                <option key={taskName} value={taskName}>{taskName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!selectedRun ? (
        <p className="text-xs text-muted-foreground italic">No playbook runs found for this environment.</p>
      ) : selectedRunRows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Selected run has no task-by-host details yet.</p>
      ) : (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
          {detailsViewMode === "activity" ? (
            Object.entries(groupedByTask)
              .sort(([, rowsA], [, rowsB]) => {
                const pa = Math.min(...rowsA.map((r) => r.position ?? Number.MAX_SAFE_INTEGER))
                const pb = Math.min(...rowsB.map((r) => r.position ?? Number.MAX_SAFE_INTEGER))
                if (pa !== pb) return pa - pb
                return (rowsA[0]?.task_name ?? "").localeCompare(rowsB[0]?.task_name ?? "")
              })
              .filter(([taskName]) => selectedActivity === "all" || taskName === selectedActivity)
              .map(([taskName, rows]) => (
                <div key={taskName} className="rounded border border-border/60 bg-muted/20 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{taskName}</span>
                    <span className="text-[11px] text-muted-foreground">{rows.length} host{rows.length === 1 ? "" : "s"}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {rows
                      .slice()
                      .sort((a, b) => {
                        const pa = a.position ?? Number.MAX_SAFE_INTEGER
                        const pb = b.position ?? Number.MAX_SAFE_INTEGER
                        if (pa !== pb) return pa - pb
                        return String(a.host ?? "").localeCompare(String(b.host ?? ""))
                      })
                      .map((row) => (
                        <div key={row.id} className="inline-flex items-center gap-1 rounded border border-border/70 bg-background px-1.5 py-1 text-[10px]">
                          <span className="font-mono text-muted-foreground">{row.host}</span>
                          <span className={`rounded px-1.5 py-0.5 font-medium ${statusClass(row.status)}`}>{row.status}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          ) : (
            Object.entries(groupedByHost)
              .sort(([hostA], [hostB]) => hostA.localeCompare(hostB))
              .map(([host, rows]) => (
                <div key={host} className="rounded border border-border/60 bg-muted/20 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{host}</span>
                    <span className="text-[11px] text-muted-foreground">{rows.length} activit{rows.length === 1 ? "y" : "ies"}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {rows
                      .slice()
                      .sort((a, b) => {
                        const pa = a.position ?? Number.MAX_SAFE_INTEGER
                        const pb = b.position ?? Number.MAX_SAFE_INTEGER
                        if (pa !== pb) return pa - pb
                        return String(a.task_name ?? "").localeCompare(String(b.task_name ?? ""))
                      })
                      .map((row) => (
                        <div key={row.id} className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground">{row.task_name}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass(row.status)}`}>{row.status}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  )
}
