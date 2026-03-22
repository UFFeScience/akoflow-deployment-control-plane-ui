"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ProvisionedResource, LogEntry } from "@/lib/api/types"
import { logsApi, TERRAFORM_RUN_SELECTOR } from "@/lib/api/logs"
import { LogsFilters } from "./logs-filters"
import { LogRow } from "./log-row"

interface LogsTabProps {
  resources: ProvisionedResource[]
  projectId: string
  environmentId: string
}

const POLL_INTERVAL_MS = 5_000

export function LogsTab({ resources, projectId, environmentId }: LogsTabProps) {
  const [logs, setLogs]                         = useState<LogEntry[]>([])
  const [filterLevel, setFilterLevel]           = useState<string>("all")
  const [selectedInstance, setSelectedInstance] = useState<string>(TERRAFORM_RUN_SELECTOR)
  const [autoScroll, setAutoScroll]             = useState(true)
  const [isLoading, setIsLoading]               = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<number | null>(null)  // last seen log id for this selection
  const runIdRef  = useRef<string | null>(null)  // resolved terraform run id

  const isTerraformRun = selectedInstance === TERRAFORM_RUN_SELECTOR

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

  // ── Initial full load + polling ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedInstance) return

    let active = true

    async function doLoad(afterId: number | null) {
      try {
        const entries = isTerraformRun
          ? await fetchTerraformLogs(afterId)
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
  }, [selectedInstance, isTerraformRun, fetchTerraformLogs, fetchResourceLogs])

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
    a.download = isTerraformRun ? "terraform-run-logs.txt" : "logs.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  function getTerminalTitle(): string {
    if (isTerraformRun) return "Terraform Run · latest"
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
        isLoading={isLoading}
      />

      {/* Section labels */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground">
          {isTerraformRun
            ? "Terraform Run Logs"
            : selectedInstance
            ? "Resource Logs"
            : "Select a resource"}{" "}
          ({displayLogs.length})
        </span>
        {isLoading && <span className="text-[10px] text-muted-foreground">Loading...</span>}
      </div>

      {/* Terminal */}
      <div className="flex flex-col rounded-lg border border-border bg-[#0d1117] overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-[#21262d] bg-[#161b22] px-3 py-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] text-gray-500 font-mono">{getTerminalTitle()}</span>
        </div>
        <div
          ref={scrollRef}
          className="overflow-y-auto p-3 font-mono text-[11px] leading-5 max-h-[420px] min-h-[200px]"
        >
          {displayLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-600">
              {isLoading ? "Fetching logs..." : "No log entries"}
            </div>
          ) : (
            displayLogs.map(log => (
              <LogRow
                key={log.id}
                log={log}
                resources={resources}
                selectedResource={isTerraformRun ? undefined : selectedInstance}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

