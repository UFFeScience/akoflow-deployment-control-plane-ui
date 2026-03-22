"use client"

import { cn, formatTimestamp } from "@/lib/utils"
import { LOG_LEVEL_BADGE, LOG_LEVEL_TEXT } from "@/lib/utils/log-levels"
import type { LogEntry, ProvisionedResource } from "@/lib/api/types"

type LogRowProps = {
  log: LogEntry
  resources: ProvisionedResource[]
  selectedResource: string | undefined
}

export function LogRow({ log, resources, selectedResource }: LogRowProps) {
  const res = selectedResource ? resources.find((r) => r.id === selectedResource) : undefined
  const resLabel = res
    ? res.name || res.provider_resource_id || `resource-${res.id}`
    : undefined

  return (
    <div className="flex gap-2 py-px hover:bg-[#161b22] rounded px-1 -mx-1 transition-colors">
      <span className="text-gray-600 shrink-0 select-none">{formatTimestamp(log.timestamp)}</span>
      <span className={cn("shrink-0 rounded px-1 text-[9px] font-bold uppercase leading-5", LOG_LEVEL_BADGE[log.level])}>
        {log.level.slice(0, 4)}
      </span>
      {log.source && <span className="shrink-0 text-indigo-400/60">[{log.source}]</span>}
      {resLabel && <span className="shrink-0 text-gray-500">{resLabel}</span>}
      <span className={cn("break-all", LOG_LEVEL_TEXT[log.level] || "text-gray-400")}>{log.message}</span>
    </div>
  )
}

