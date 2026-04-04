"use client"

import { type RefObject } from "react"
import { Loader2 } from "lucide-react"
import type { LogEntry, ProvisionedResource } from "@/lib/api/types"
import { LogRow } from "./log-row"

interface LogTerminalProps {
  title: string
  entries: LogEntry[]
  loading?: boolean
  resources?: ProvisionedResource[]
  selectedResource?: string
  scrollRef?: RefObject<HTMLDivElement | null>
  maxHeight?: string
  minHeight?: string
  footer?: React.ReactNode
  emptyText?: string
}

export function LogTerminal({
  title,
  entries,
  loading = false,
  resources = [],
  selectedResource,
  scrollRef,
  maxHeight = "max-h-[420px]",
  minHeight = "min-h-[200px]",
  footer,
  emptyText = "No log entries",
}: LogTerminalProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-[#0d1117] overflow-hidden">
      {/* Traffic light bar */}
      <div className="flex items-center gap-1.5 border-b border-[#21262d] bg-[#161b22] px-3 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-[10px] text-gray-500 font-mono">{title}</span>
      </div>

      {/* Log body */}
      <div
        ref={scrollRef}
        className={`overflow-y-auto p-3 font-mono text-[11px] leading-5 ${maxHeight} ${minHeight}`}
      >
        {loading && entries.length === 0 ? (
          <div className="flex items-center gap-2 py-8 justify-center text-gray-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Fetching logs…</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-600">
            {emptyText}
          </div>
        ) : (
          entries.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              resources={resources}
              selectedResource={selectedResource}
            />
          ))
        )}
      </div>

      {/* Optional footer slot */}
      {footer && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#21262d] bg-[#161b22] text-[10px] text-gray-500">
          {footer}
        </div>
      )}
    </div>
  )
}
