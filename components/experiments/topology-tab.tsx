"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Server, Cpu, MemoryStick, MonitorSpeaker, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Instance, InstanceConfig, Experiment } from "@/lib/api/types"

interface TopologyTabProps {
  experiment: Experiment
  instances: Instance[]
  configs: InstanceConfig[]
  onInstanceSelect?: (instance: Instance) => void
}

const statusDot: Record<string, string> = {
  running: "bg-emerald-500",
  pending: "bg-amber-500",
  failed: "bg-red-500",
  stopped: "bg-gray-400 dark:bg-gray-600",
}

const statusRing: Record<string, string> = {
  running: "ring-emerald-500/20",
  pending: "ring-amber-500/20",
  failed: "ring-red-500/20",
  stopped: "ring-gray-400/20",
}

function getConfigSummary(instanceId: string, configs: InstanceConfig[]) {
  const cfgs = configs.filter((c) => c.instanceId === instanceId)
  let totalCpu = 0, totalMem = 0, gpuCount = 0
  const types: string[] = []
  for (const c of cfgs) {
    totalCpu += (parseInt(c.cpu) || 0) * c.quantity
    totalMem += (parseFloat(c.memory) || 0) * c.quantity
    if (c.gpu !== "None") {
      const m = c.gpu.match(/(\d+)x/)
      gpuCount += (m ? parseInt(m[1]) : 1) * c.quantity
    }
    types.push(`${c.instanceType} x${c.quantity}`)
  }
  return { totalCpu, totalMem, gpuCount, types, qty: cfgs.reduce((s, c) => s + c.quantity, 0) }
}

function InstanceNode({ instance, configs, onClick }: { instance: Instance; configs: InstanceConfig[]; onClick?: () => void }) {
  const summary = getConfigSummary(instance.id, configs)

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card p-2.5 transition-all hover:shadow-md hover:scale-[1.03] cursor-pointer ring-1",
              statusRing[instance.status]
            )}
          >
            <div className="flex items-center gap-1.5">
              <div className={cn("h-1.5 w-1.5 rounded-full", statusDot[instance.status], instance.status === "running" && "animate-pulse")} />
              <span className="text-[10px] font-medium text-foreground">{instance.region}</span>
            </div>
            <Server className="h-4 w-4 text-muted-foreground" />
            {summary.qty > 0 && (
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Cpu className="h-2 w-2" />{summary.totalCpu}</span>
                <span className="flex items-center gap-0.5"><MemoryStick className="h-2 w-2" />{summary.totalMem}G</span>
                {summary.gpuCount > 0 && <span className="flex items-center gap-0.5"><MonitorSpeaker className="h-2 w-2" />{summary.gpuCount}</span>}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold">{instance.provider.toUpperCase()} - {instance.region}</p>
            <p className="text-muted-foreground capitalize">{instance.status}</p>
            {summary.types.length > 0 && summary.types.map((t, i) => (
              <p key={i} className="font-mono text-muted-foreground">{t}</p>
            ))}
            <p className="text-muted-foreground">{summary.totalCpu} vCPU / {summary.totalMem} GB / {summary.gpuCount} GPU</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ProviderCluster({
  label,
  color,
  borderColor,
  bgTint,
  instances,
  configs,
  onInstanceClick,
}: {
  label: string
  color: string
  borderColor: string
  bgTint: string
  instances: Instance[]
  configs: InstanceConfig[]
  onInstanceClick?: (instance: Instance) => void
}) {
  if (instances.length === 0) return null

  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-lg border-2 p-4 relative", borderColor)}>
      <div className={cn("absolute inset-0 rounded-lg opacity-[0.02]", bgTint)} />
      <span className={cn("text-[10px] font-bold uppercase tracking-wider relative", color)}>{label}</span>
      <div className="relative flex flex-wrap items-center justify-center gap-2">
        {instances.map((inst) => (
          <InstanceNode key={inst.id} instance={inst} configs={configs} onClick={() => onInstanceClick?.(inst)} />
        ))}
      </div>
    </div>
  )
}

export function TopologyTab({ experiment, instances, configs, onInstanceSelect }: TopologyTabProps) {
  const [selected, setSelected] = useState<Instance | null>(null)

  const awsInstances = useMemo(() => instances.filter((i) => i.provider === "aws"), [instances])
  const gcpInstances = useMemo(() => instances.filter((i) => i.provider === "gcp"), [instances])

  function handleClick(inst: Instance) {
    setSelected(inst)
    onInstanceSelect?.(inst)
  }

  const selectedSummary = selected ? getConfigSummary(selected.id, configs) : null

  return (
    <div className="flex flex-col gap-4">
      {instances.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-xs text-muted-foreground">
          No instances deployed for this experiment.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* Experiment node at top */}
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 px-4 py-2">
              <span className="text-xs font-semibold text-primary">{experiment.name}</span>
            </div>
            <div className="h-6 w-px bg-border" />
          </div>

          {/* Provider clusters */}
          <div className="flex flex-wrap items-start justify-center gap-6 w-full">
            <ProviderCluster
              label="AWS"
              color="text-orange-700 dark:text-orange-400"
              borderColor="border-orange-200 dark:border-orange-800/50"
              bgTint="bg-orange-500"
              instances={awsInstances}
              configs={configs}
              onInstanceClick={handleClick}
            />
            <ProviderCluster
              label="GCP"
              color="text-blue-700 dark:text-blue-400"
              borderColor="border-blue-200 dark:border-blue-800/50"
              bgTint="bg-blue-500"
              instances={gcpInstances}
              configs={configs}
              onInstanceClick={handleClick}
            />
          </div>
        </div>
      )}

      {/* Side panel for selected instance */}
      {selected && (
        <div className="rounded-lg border border-border bg-card p-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground">Instance Detail</span>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground">Provider</p>
              <p className="font-medium text-foreground">{selected.provider.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Region</p>
              <p className="font-medium text-foreground">{selected.region}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Status</p>
              <p className={cn("font-medium capitalize",
                selected.status === "running" && "text-emerald-600 dark:text-emerald-400",
                selected.status === "failed" && "text-red-600 dark:text-red-400",
                selected.status === "pending" && "text-amber-600 dark:text-amber-400",
              )}>{selected.status}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Resources</p>
              <p className="font-medium text-foreground">{selectedSummary?.totalCpu} vCPU / {selectedSummary?.totalMem} GB / {selectedSummary?.gpuCount} GPU</p>
            </div>
          </div>
          {selectedSummary && selectedSummary.types.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1.5">Configurations</p>
              {selectedSummary.types.map((t, i) => (
                <p key={i} className="font-mono text-[10px] text-foreground">{t}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
