"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Instance } from "@/lib/api/types"

function toProviderLabel(value: unknown): string {
  const str = typeof value === "string" ? value : value ? String(value) : "unknown"
  return str.toUpperCase()
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

type LogsFiltersProps = {
  filterLevel: string
  setFilterLevel: (v: string) => void
  selectedInstance: string
  setSelectedInstance: (v: string) => void
  autoScroll: boolean
  setAutoScroll: (v: boolean) => void
  handleDownload: () => void
  instances: Instance[]
  isLoading: boolean
}

export function LogsFilters({
  filterLevel,
  setFilterLevel,
  selectedInstance,
  setSelectedInstance,
  autoScroll,
  setAutoScroll,
  handleDownload,
  instances,
  isLoading,
}: LogsFiltersProps) {
  return (
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
      <Select value={selectedInstance} onValueChange={setSelectedInstance}>
        <SelectTrigger className="w-48 h-7 text-[10px]">
          <SelectValue placeholder="Select instance" />
        </SelectTrigger>
        <SelectContent>
          {instances.map((inst) => (
            <SelectItem key={inst.id} value={inst.id} className="text-xs">
              {getInstanceLabel(inst)} · {getInstanceRole(inst)} · {toProviderLabel(inst.provider ?? (inst as any).provider_id ?? (inst as any).cloud_provider)} · {inst.region ?? "unknown"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1.5 ml-auto">
        <Switch checked={autoScroll} onCheckedChange={setAutoScroll} className="scale-75" />
        <span className="text-[10px] text-muted-foreground">Auto-scroll</span>
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleDownload} disabled={!selectedInstance}>
        <Download className="mr-1 h-3 w-3" />
        Download
      </Button>
    </div>
  )
}
