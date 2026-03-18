"use client"

import { useState, useRef, useEffect } from "react"
import { getInstanceLabel, getInstanceRole } from "@/lib/utils/instance"
import type { Instance, LogEntry } from "@/lib/api/types"
import { logsApi } from "@/lib/api/logs"
import { LogsFilters } from "./logs-filters"
import { LogRow } from "./log-row"

function toProviderLabel(value: unknown): string {
  const str = typeof value === "string" ? value : value ? String(value) : "unknown"
  return str.toUpperCase()
}

interface LogsTabProps {
  instances: Instance[]
}

export function LogsTab({ instances }: LogsTabProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [selectedInstance, setSelectedInstance] = useState<string>("")
  const [autoScroll, setAutoScroll] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedInstance && instances.length > 0) {
      setSelectedInstance(instances[0].id)
    }
  }, [instances, selectedInstance])

  useEffect(() => {
    if (!selectedInstance) {
      setLogs([])
      return
    }

    let active = true
    setIsLoading(true)

    async function loadLogs() {
      try {
        const data = await logsApi.byInstance(selectedInstance)
        if (active) setLogs(data)
      } catch {
        if (active) setLogs([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadLogs()

    return () => {
      active = false
    }
  }, [selectedInstance])

  const displayLogs = logs.filter((log) => filterLevel === "all" || log.level === filterLevel)

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayLogs, autoScroll])

  function handleDownload() {
    const content = displayLogs.map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`).join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "logs.txt"
    a.click()
    URL.revokeObjectURL(url)
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
        instances={instances}
        isLoading={isLoading}
      />

      {/* Section labels */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground">
          {selectedInstance ? "Instance Logs" : "Select an instance"} ({displayLogs.length})
        </span>
        {isLoading && <span className="text-[10px] text-muted-foreground">Loading...</span>}
      </div>

      {/* Terminal */}
      <div className="flex flex-col rounded-lg border border-border bg-[#0d1117] overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-[#21262d] bg-[#161b22] px-3 py-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] text-gray-500 font-mono">
            {selectedInstance
              ? `${getInstanceLabel(instances.find((i) => i.id === selectedInstance))} · ${getInstanceRole(instances.find((i) => i.id === selectedInstance))} · ${toProviderLabel(instances.find((i) => i.id === selectedInstance)?.provider ?? (instances.find((i) => i.id === selectedInstance) as any)?.provider_id ?? (instances.find((i) => i.id === selectedInstance) as any)?.cloud_provider)} · ${instances.find((i) => i.id === selectedInstance)?.region ?? "unknown"}`
              : "No instance selected"}
          </span>
        </div>
        <div ref={scrollRef} className="overflow-y-auto p-3 font-mono text-[11px] leading-5 max-h-[420px] min-h-[200px]">
          {displayLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-600">
              {isLoading ? "Fetching logs..." : "No log entries"}
            </div>
          ) : (
            displayLogs.map((log) => <LogRow key={log.id} log={log} instances={instances} selectedInstance={selectedInstance} />)
          )}
        </div>
      </div>
    </div>
  )
}
