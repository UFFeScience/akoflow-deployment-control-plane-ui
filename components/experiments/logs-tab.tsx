"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Instance, LogEntry } from "@/lib/api"
import { logsApi } from "@/lib/api"

interface LogsTabProps {
  experimentId: string
  instances: Instance[]
}

const levelBadge: Record<string, string> = {
  info: "text-emerald-400 bg-emerald-400/10",
  warning: "text-amber-400 bg-amber-400/10",
  error: "text-red-400 bg-red-400/10",
  debug: "text-blue-400 bg-blue-400/10",
}

const levelTextColor: Record<string, string> = {
  info: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
  debug: "text-blue-400",
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export function LogsTab({ experimentId, instances }: LogsTabProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [filterInstance, setFilterInstance] = useState<string>("all")
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function loadLogs() {
      try {
        const data = await logsApi.list({ experimentId })
        if (active) setLogs(data)
      } catch {
        if (active) setLogs([])
      }
    }

    loadLogs()

    return () => {
      active = false
    }
  }, [experimentId])

  const allLogs = useMemo(() => {
    return logs
      .filter((log) => log.experimentId === experimentId)
      .filter((log) => filterLevel === "all" || log.level === filterLevel)
      .filter((log) => filterInstance === "all" || log.instanceId === filterInstance)
  }, [experimentId, filterLevel, filterInstance, logs])

  const instanceLogs = useMemo(() => {
    if (filterInstance === "all") return []
    return logs
      .filter((log) => log.instanceId === filterInstance)
      .filter((log) => filterLevel === "all" || log.level === filterLevel)
  }, [filterInstance, filterLevel, logs])

  const displayLogs = filterInstance !== "all" ? instanceLogs : allLogs

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
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-28 h-7 text-[10px]">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All levels</SelectItem>
            <SelectItem value="info" className="text-xs">Info</SelectItem>
            <SelectItem value="warning" className="text-xs">Warning</SelectItem>
            <SelectItem value="error" className="text-xs">Error</SelectItem>
            <SelectItem value="debug" className="text-xs">Debug</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterInstance} onValueChange={setFilterInstance}>
          <SelectTrigger className="w-40 h-7 text-[10px]">
            <SelectValue placeholder="All instances" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All instances</SelectItem>
            {instances.map((inst) => (
              <SelectItem key={inst.id} value={inst.id} className="text-xs">
                {inst.provider.toUpperCase()} - {inst.region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5 ml-auto">
          <Switch checked={autoScroll} onCheckedChange={setAutoScroll} className="scale-75" />
          <span className="text-[10px] text-muted-foreground">Auto-scroll</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleDownload}>
          <Download className="mr-1 h-3 w-3" />
          Download
        </Button>
      </div>

      {/* Section labels */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground">
          {filterInstance !== "all" ? "Instance Logs" : "Experiment Logs"} ({displayLogs.length})
        </span>
      </div>

      {/* Terminal */}
      <div className="flex flex-col rounded-lg border border-border bg-[#0d1117] overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-[#21262d] bg-[#161b22] px-3 py-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] text-gray-500 font-mono">
            {filterInstance !== "all"
              ? `${instances.find((i) => i.id === filterInstance)?.provider.toUpperCase()} - ${instances.find((i) => i.id === filterInstance)?.region}`
              : experimentId}
          </span>
        </div>
        <div ref={scrollRef} className="overflow-y-auto p-3 font-mono text-[11px] leading-5 max-h-[420px] min-h-[200px]">
          {displayLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-600">No log entries</div>
          ) : (
            displayLogs.map((log) => (
              <div key={log.id} className="flex gap-2 py-px hover:bg-[#161b22] rounded px-1 -mx-1 transition-colors">
                <span className="text-gray-600 shrink-0 select-none">{formatTime(log.timestamp)}</span>
                <span className={cn("shrink-0 rounded px-1 text-[9px] font-bold uppercase leading-5", levelBadge[log.level])}>
                  {log.level.slice(0, 4)}
                </span>
                {log.source && <span className="shrink-0 text-indigo-400/60">[{log.source}]</span>}
                <span className={cn("break-all", levelTextColor[log.level] || "text-gray-400")}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
