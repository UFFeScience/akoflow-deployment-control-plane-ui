"use client"

import { useMemo, useState } from "react"
import type { Activity, ActivityRun, PlaybookRunTaskHostStatus } from "@/lib/api/types"

interface ActivityExecutionDetailsProps {
  runs: ActivityRun[]
  activities?: Activity[]
}

interface ParsedPlaybook {
  taskToPlay: Record<string, string>
  playOrder: Record<string, number>
}

function normalizeYamlName(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function parsePlaybookStructure(playbookYaml?: string | null): ParsedPlaybook {
  if (!playbookYaml) return { taskToPlay: {}, playOrder: {} }

  const taskToPlay: Record<string, string> = {}
  const playOrder: Record<string, number> = {}
  const lines = playbookYaml.split(/\r?\n/)
  let currentPlay = "General"
  let nextPlayOrder = 0

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "    ")
    const indent = line.match(/^\s*/)?.[0]?.length ?? 0
    const nameMatch = line.match(/^\s*-\s*name\s*:\s*(.+)$/)
    if (!nameMatch) continue

    const name = normalizeYamlName(nameMatch[1])
    if (!name) continue

    if (indent <= 2) {
      currentPlay = name
      if (!(currentPlay in playOrder)) {
        playOrder[currentPlay] = nextPlayOrder
        nextPlayOrder += 1
      }
      continue
    }

    if (!(currentPlay in playOrder)) {
      playOrder[currentPlay] = nextPlayOrder
      nextPlayOrder += 1
    }
    if (!(name in taskToPlay)) taskToPlay[name] = currentPlay
  }

  return { taskToPlay, playOrder }
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

export function ActivityExecutionDetails({ runs, activities = [] }: ActivityExecutionDetailsProps) {
  const [detailsRunId, setDetailsRunId] = useState<string>("latest")
  const [detailsViewMode, setDetailsViewMode] = useState<"play" | "host">("play")
  const [selectedPlay, setSelectedPlay] = useState<string>("all")

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

  // Rows pre-sorted by position so groupedByTask insertion order reflects execution order.
  const selectedRunRows = useMemo(
    () => [...((selectedRun?.task_host_statuses ?? []) as PlaybookRunTaskHostStatus[])]
      .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)),
    [selectedRun],
  )

  const selectedRunActivity = useMemo(
    () => activities.find((a) => String(a.id) === String(selectedRun?.playbook_id ?? selectedRun?.activity_id)),
    [activities, selectedRun],
  )

  const parsedPlaybook = useMemo(
    () => parsePlaybookStructure(selectedRunActivity?.playbook_yaml),
    [selectedRunActivity],
  )

  // Canonical task order: task_name → position.
  // Primary: row.position (set by backend from ansible_playbook_tasks.position — most reliable).
  // Secondary: activity.tasks from allPlaybooks (fills gaps for not-yet-started tasks).
  const taskPositionMap = useMemo(() => {
    const map: Record<string, number> = {}

    for (const row of selectedRunRows) {
      if (row.task_name && row.position != null && !(row.task_name in map)) {
        map[row.task_name] = row.position
      }
    }

    if (selectedRunActivity) {
      ;[...(selectedRunActivity.tasks ?? [])]
        .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER))
        .forEach((t, idx) => {
          if (!(t.name in map)) map[t.name] = t.position ?? idx
        })
    }

    return map
  }, [selectedRunRows, selectedRunActivity])

  const getTaskPosition = (taskName: string, fallback?: number | null): number => {
    if (taskName in taskPositionMap) return taskPositionMap[taskName]
    return fallback ?? Number.MAX_SAFE_INTEGER
  }

  const getTaskPlay = (taskName?: string | null): string => {
    const normalizedTaskName = String(taskName ?? "").trim()
    if (!normalizedTaskName) return "General"
    return parsedPlaybook.taskToPlay[normalizedTaskName] ?? "General"
  }

  const getPlayOrder = (playName: string): number => {
    if (playName in parsedPlaybook.playOrder) return parsedPlaybook.playOrder[playName]
    return Number.MAX_SAFE_INTEGER
  }

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

  const sortedTaskEntries = useMemo(
    () =>
      Object.entries(groupedByTask).sort(([, rowsA], [, rowsB]) => {
        const pa = getTaskPosition(rowsA[0]?.task_name ?? "", Math.min(...rowsA.map((r) => r.position ?? Number.MAX_SAFE_INTEGER)))
        const pb = getTaskPosition(rowsB[0]?.task_name ?? "", Math.min(...rowsB.map((r) => r.position ?? Number.MAX_SAFE_INTEGER)))
        if (pa !== pb) return pa - pb
        return (rowsA[0]?.task_name ?? "").localeCompare(rowsB[0]?.task_name ?? "", undefined, { numeric: true })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupedByTask, taskPositionMap],
  )

  const groupedByPlay = useMemo(
    () => sortedTaskEntries.reduce<Record<string, Array<[string, PlaybookRunTaskHostStatus[]]>>>((acc, [taskName, rows]) => {
      const playName = getTaskPlay(taskName)
      if (!acc[playName]) acc[playName] = []
      acc[playName].push([taskName, rows])
      return acc
    }, {}),
    [sortedTaskEntries, parsedPlaybook],
  )

  const playOptions = useMemo(
    () => Object.keys(groupedByPlay).sort((a, b) => {
      const pa = getPlayOrder(a)
      const pb = getPlayOrder(b)
      if (pa !== pb) return pa - pb
      return a.localeCompare(b, undefined, { numeric: true })
    }),
    [groupedByPlay, parsedPlaybook],
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
              onClick={() => setDetailsViewMode("play")}
              className={`rounded px-2 py-1 ${detailsViewMode === "play" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              By play
            </button>
            <button
              type="button"
              onClick={() => setDetailsViewMode("host")}
              className={`rounded px-2 py-1 ${detailsViewMode === "host" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              By host
            </button>
          </div>

          {detailsViewMode === "play" && (
            <select
              value={selectedPlay}
              onChange={(e) => setSelectedPlay(e.target.value)}
              className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
            >
              <option value="all">All plays</option>
              {playOptions.map((playName) => (
                <option key={playName} value={playName}>{playName}</option>
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
          {detailsViewMode === "play" ? (
            Object.entries(groupedByPlay)
              .sort(([playA], [playB]) => {
                const pa = getPlayOrder(playA)
                const pb = getPlayOrder(playB)
                if (pa !== pb) return pa - pb
                return playA.localeCompare(playB, undefined, { numeric: true })
              })
              .filter(([playName]) => selectedPlay === "all" || playName === selectedPlay)
              .map(([playName, tasks]) => {
                return (
                  <div key={playName} className="rounded border border-border/60 bg-muted/20 p-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">{playName}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{tasks.length} task{tasks.length === 1 ? "" : "s"}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {tasks.map(([taskName, rows], idx) => {
                        const pos = getTaskPosition(taskName, rows[0]?.position)
                        const stepNum = pos !== Number.MAX_SAFE_INTEGER ? pos + 1 : idx + 1
                        return (
                          <div key={taskName} className="rounded border border-border/50 bg-background/60 p-2">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="shrink-0 inline-flex items-center justify-center rounded bg-muted text-muted-foreground font-mono text-[10px] w-5 h-5">{stepNum}</span>
                                <span className="text-xs font-medium text-foreground truncate">{taskName}</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground shrink-0">{rows.length} host{rows.length === 1 ? "" : "s"}</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {rows
                                .slice()
                                .sort((a, b) =>
                                  String(a.host ?? "").localeCompare(String(b.host ?? ""), undefined, { numeric: true })
                                )
                                .map((row) => (
                                  <div key={row.id} className="inline-flex items-center gap-1 rounded border border-border/70 bg-background px-1.5 py-1 text-[10px]">
                                    <span className="font-mono text-muted-foreground">{row.host}</span>
                                    <span className={`rounded px-1.5 py-0.5 font-medium ${statusClass(row.status)}`}>{row.status}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
          ) : (
            Object.entries(groupedByHost)
              .sort(([hostA], [hostB]) => hostA.localeCompare(hostB, undefined, { numeric: true }))
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
                        const pa = getTaskPosition(a.task_name, a.position)
                        const pb = getTaskPosition(b.task_name, b.position)
                        if (pa !== pb) return pa - pb
                        return String(a.task_name ?? "").localeCompare(String(b.task_name ?? ""), undefined, { numeric: true })
                      })
                      .map((row) => (
                        <div key={row.id} className="flex items-center gap-1.5 text-xs">
                          <span className="shrink-0 inline-flex items-center justify-center rounded bg-muted text-muted-foreground font-mono text-[10px] w-5 h-5">{getTaskPosition(row.task_name, row.position) + 1}</span>
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
