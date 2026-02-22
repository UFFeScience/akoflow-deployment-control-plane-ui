"use client"

import { Plus, Minus, Cpu, MemoryStick, MonitorSpeaker } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { Instance, InstanceConfig } from "@/lib/api"
import { toast } from "sonner"
import { instancesApi } from "@/lib/api"

interface ScalingTabProps {
  experimentId: string
  instances: Instance[]
  allConfigs: InstanceConfig[]
  onConfigsChange: (configs: InstanceConfig[]) => void
}

export function ScalingTab({ experimentId, instances, allConfigs, onConfigsChange }: ScalingTabProps) {
  async function handleScale(configId: string, delta: number) {
    const previous = allConfigs
    const next = allConfigs.map((c) =>
      c.id === configId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
    )
    onConfigsChange(next)

    const target = previous.find((c) => c.id === configId)
    const inst = instances.find((i) => i.id === target?.instanceId)
    if (!target || !inst) return

    try {
      const nextQty = Math.max(0, target.quantity + delta)
      await instancesApi.scale(experimentId, inst.id, configId, nextQty)
      toast.success(`Scaled ${delta > 0 ? "up" : "down"} by ${Math.abs(delta)}`)
    } catch {
      onConfigsChange(previous)
      toast.error("Failed to scale instance")
    }
  }

  // Compute projected totals
  let totalCpu = 0, totalMem = 0, totalGpu = 0, totalQty = 0
  for (const inst of instances) {
    const cfgs = allConfigs.filter((c) => c.instanceId === inst.id)
    for (const cfg of cfgs) {
      totalCpu += (parseInt(cfg.cpu) || 0) * cfg.quantity
      totalMem += (parseFloat(cfg.memory) || 0) * cfg.quantity
      if (cfg.gpu !== "None") {
        const m = cfg.gpu.match(/(\d+)x/)
        totalGpu += (m ? parseInt(m[1]) : 1) * cfg.quantity
      }
      totalQty += cfg.quantity
    }
  }

  if (instances.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-xs text-muted-foreground">
        No instances to scale. Add instances first.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Projected totals */}
      <div className="flex flex-wrap items-center gap-6 text-xs rounded-md border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Total Nodes</span>
          <span className="font-bold text-foreground">{totalQty}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-muted-foreground" />
          <span className="font-bold text-foreground">{totalCpu} vCPU</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <MemoryStick className="h-3 w-3 text-muted-foreground" />
          <span className="font-bold text-foreground">{Math.round(totalMem)} GB</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <MonitorSpeaker className="h-3 w-3 text-muted-foreground" />
          <span className="font-bold text-foreground">{totalGpu} GPU</span>
        </div>
      </div>

      {/* Per instance scaling controls */}
      <div className="flex flex-col gap-3">
        {instances.map((inst) => {
          const cfgs = allConfigs.filter((c) => c.instanceId === inst.id)
          if (cfgs.length === 0) return null

          return (
            <div key={inst.id} className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge type="provider" value={inst.provider} />
                <span className="text-xs font-medium text-foreground">{inst.region}</span>
                <StatusBadge type="status" value={inst.status} />
              </div>
              <div className="flex flex-col gap-2">
                {cfgs.map((cfg) => {
                  const cpuVal = (parseInt(cfg.cpu) || 0) * cfg.quantity
                  const memVal = Math.round((parseFloat(cfg.memory) || 0) * cfg.quantity)
                  const gpuMatch = cfg.gpu.match(/(\d+)x/)
                  const gpuVal = (gpuMatch ? parseInt(gpuMatch[1]) : (cfg.gpu === "None" ? 0 : 1)) * cfg.quantity

                  return (
                    <div key={cfg.id} className="flex items-center justify-between rounded bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] font-medium text-foreground">{cfg.instanceType}</span>
                        <span className="text-[10px] text-muted-foreground">{cpuVal} vCPU / {memVal} GB / {gpuVal} GPU</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleScale(cfg.id, -1)}
                          disabled={cfg.quantity <= 0}
                        >
                          <Minus className="h-2.5 w-2.5" />
                          <span className="sr-only">Scale down</span>
                        </Button>
                        <span className="w-8 text-center text-xs font-bold text-foreground">{cfg.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleScale(cfg.id, 1)}
                        >
                          <Plus className="h-2.5 w-2.5" />
                          <span className="sr-only">Scale up</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
