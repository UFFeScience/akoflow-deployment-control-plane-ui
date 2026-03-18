"use client"

import { cn, formatTimestamp } from "@/lib/utils"
import { LOG_LEVEL_BADGE, LOG_LEVEL_TEXT } from "@/lib/utils/log-levels"
import { getInstanceLabel, getInstanceRole } from "@/lib/utils/instance"
import type { LogEntry, Instance } from "@/lib/api/types"

type LogRowProps = {
  log: LogEntry
  instances: Instance[]
  selectedInstance: string
}

export function LogRow({ log, instances, selectedInstance }: LogRowProps) {
  const inst = instances.find((i) => i.id === selectedInstance)

  return (
    <div className="flex gap-2 py-px hover:bg-[#161b22] rounded px-1 -mx-1 transition-colors">
      <span className="text-gray-600 shrink-0 select-none">{formatTimestamp(log.timestamp)}</span>
      <span className={cn("shrink-0 rounded px-1 text-[9px] font-bold uppercase leading-5", LOG_LEVEL_BADGE[log.level])}>
        {log.level.slice(0, 4)}
      </span>
      {log.source && <span className="shrink-0 text-indigo-400/60">[{log.source}]</span>}
      <span className="shrink-0 text-gray-500">{getInstanceLabel(inst)}</span>
      <span className="shrink-0 text-gray-500">{getInstanceRole(inst)}</span>
      <span className={cn("break-all", LOG_LEVEL_TEXT[log.level] || "text-gray-400")}>{log.message}</span>
    </div>
  )
}

