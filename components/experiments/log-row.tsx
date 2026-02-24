"use client"

import { cn, formatTimestamp } from "@/lib/utils"
import type { LogEntry, Instance } from "@/lib/api/types"

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

function getInstanceLabel(inst?: Partial<Instance> | null): string {
  if (!inst) return "Unknown instance"
  const name = (inst as any).name as string | undefined
  if (name && name.trim()) return name.trim()
  const publicIp = (inst as any).publicIp || (inst as any).public_ip
  const privateIp = (inst as any).privateIp || (inst as any).private_ip
  if (publicIp) return String(publicIp)
  if (privateIp) return String(privateIp)
  return `instance-${inst.id}`
}

function getInstanceRole(inst?: Partial<Instance> | null): string {
  if (!inst) return "--"
  const role = (inst as any).role ?? (inst as any).instance_role
  return typeof role === "string" && role.trim().length > 0 ? role.trim() : "--"
}

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
      <span className={cn("shrink-0 rounded px-1 text-[9px] font-bold uppercase leading-5", levelBadge[log.level])}>
        {log.level.slice(0, 4)}
      </span>
      {log.source && <span className="shrink-0 text-indigo-400/60">[{log.source}]</span>}
      <span className="shrink-0 text-gray-500">{getInstanceLabel(inst)}</span>
      <span className="shrink-0 text-gray-500">{getInstanceRole(inst)}</span>
      <span className={cn("break-all", levelTextColor[log.level] || "text-gray-400")}>{log.message}</span>
    </div>
  )
}
