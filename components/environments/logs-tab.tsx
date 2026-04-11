"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ProvisionedResource, LogEntry } from "@/lib/api/types"
import { logsApi, TERRAFORM_RUN_SELECTOR, PLAYBOOK_RUN_SELECTOR_PREFIX, makePlaybookRunSelector, parsePlaybookRunSelector } from "@/lib/api/logs"
import { LogsFilters } from "./logs-filters"
import type { ActivityRunOption } from "./logs-filters"
import { LogTerminal } from "./log-terminal"

interface LogsTabProps {
  resources: ProvisionedResource[]
  projectId: string
  environmentId: string
  activityRuns?: ActivityRunOption[]
}

const POLL_INTERVAL_MS = 5_000

export function LogsTab({ resources, projectId, environmentId, activityRuns = [] }: LogsTabProps) {
  const [logs, setLogs]                         = useState<LogEntry[]>([])
  const [filterLevel, setFilterLevel]           = useState<string>("all")
  const [selectedInstance, setSelectedInstance] = useState<string>(TERRAFORM_RUN_SELECTOR)
  const [autoScroll, setAutoScroll]             = useState(true)
  const [isLoading, setIsLoading]               = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<number | null>(null)  // last seen log id for this selection
  const runIdRef  = useRef<string | null>(null)  // resolved terraform run id

  const isTerraformRun  = selectedInstance === TERRAFORM_RUN_SELECTOR
  const isActivityRun   = selectedInstance.startsWith(PLAYBOOK_RUN_SELECTOR_PREFIX)

  // Prefer playbook run logs by default when available.
  useEffect(() => {
    if (activityRuns.length === 0) return
    const selectedIsLegacyOrDefault = selectedInstance === TERRAFORM_RUN_SELECTOR
    if (selectedIsLegacyOrDefault) {
      setSelectedInstance(makePlaybookRunSelector(activityRuns[0].id))
    }
  }, [activityRuns, selectedInstance])

  // ── Reset when the selected source changes ──────────────────────────────────
  useEffect(() => {
    setLogs([])
    lastIdRef.current = null
    runIdRef.current  = null
  }, [selectedInstance])

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  const fetchTerraformLogs = useCallback(
    async (afterId: number | null): Promise<LogEntry[]> => {
      const { entries, runId } = await logsApi.terraformRunLogs(
        projectId,
        environmentId,
        runIdRef.current,
        afterId,
      )
      if (runId) runIdRef.current = runId
      return entries
    },
    [projectId, environmentId],
  )

  const fetchResourceLogs = useCallback(
    async (afterId: number | null): Promise<LogEntry[]> => {
      return logsApi.byResource(selectedInstance, afterId)
    },
    [selectedInstance],
  )

  const fetchActivityRunLogs = useCallback(
    async (afterId: number | null): Promise<LogEntry[]> => {
      const runId = parsePlaybookRunSelector(selectedInstance)
      if (!runId) return []
      return logsApi.playbookRunLogs(projectId, environmentId, runId, afterId)
    },
    [projectId, environmentId, selectedInstance],
  )

  // ── Initial full load + polling ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedInstance) return

    let active = true

    async function doLoad(afterId: number | null) {
      try {
        const entries = isTerraformRun
          ? await fetchTerraformLogs(afterId)
          : isActivityRun
          ? await fetchActivityRunLogs(afterId)
          : await fetchResourceLogs(afterId)

        if (!active) return

        if (afterId === null) {
          // Initial load — replace everything
          setLogs(entries)
        } else if (entries.length > 0) {
          // Incremental — append new rows only
          setLogs(prev => [...prev, ...entries])
        }

        if (entries.length > 0) {
          lastIdRef.current = entries[entries.length - 1].id
        }
      } catch {
        // silently ignore poll errors
      }
    }

    // Initial full load
    setIsLoading(true)
    doLoad(null).finally(() => { if (active) setIsLoading(false) })

    // Incremental polling
    const intervalId = setInterval(() => {
      doLoad(lastIdRef.current)
    }, POLL_INTERVAL_MS)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [selectedInstance, isTerraformRun, isActivityRun, fetchTerraformLogs, fetchActivityRunLogs, fetchResourceLogs])

  // ── Filtered view ───────────────────────────────────────────────────────────
  const displayLogs = logs.filter(
    log => filterLevel === "all" || log.level === filterLevel
  )

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayLogs, autoScroll])

  // ── Download ────────────────────────────────────────────────────────────────
  function handleDownload() {
    const content = displayLogs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = isTerraformRun ? "terraform-provision-logs.txt" : isActivityRun ? "playbook-run-logs.txt" : "logs.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  function getTerminalTitle(): string {
    if (isTerraformRun) return "Terraform Run · Provision · latest"
    if (isActivityRun) {
      const runId = parsePlaybookRunSelector(selectedInstance)
      const opt   = activityRuns.find(r => r.id === runId)
      return opt?.label ?? `Playbook Run · ${runId}`
    }
    if (!selectedInstance) return "No resource selected"
    const res  = resources.find(r => r.id === selectedInstance)
    const name = res?.name ?? res?.provider_resource_id ?? `resource-${res?.id ?? "?"}`
    return `${name} · ${res?.resource_type?.kind?.slug ?? "—"} · ${res?.resource_type?.slug ?? "—"}`
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters row */}
      <LogsFilters
        filterLevel={filterLevel}
        setFilterLevel={setFilterLevel}
        selectedInstance={selectedInstance}
        setSelectedInstance={setSelectedInstance}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        handleDownload={handleDownload}
        resources={resources}
        activityRuns={activityRuns}
        isLoading={isLoading}
      />

      {/* Section labels */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground">
          {isTerraformRun
            ? "Terraform Run Logs"
            : isActivityRun
            ? "Playbook Run Logs"
            : selectedInstance
            ? "Resource Logs"
            : "Select a resource"}{" "}
          ({displayLogs.length})
        </span>
        {isLoading && <span className="text-[10px] text-muted-foreground">Loading...</span>}
      </div>

      {/* Terminal */}
      <LogTerminal
        title={getTerminalTitle()}
        entries={displayLogs}
        loading={isLoading}
        resources={resources}
        selectedResource={isTerraformRun ? undefined : selectedInstance}
        scrollRef={scrollRef}
        emptyText={isLoading ? "Fetching logs…" : "No log entries"}
      />
    </div>
  )
}

