"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopologyTab } from "@/components/experiments/topology-tab"
import { InstancesTab } from "@/components/experiments/instances-tab"
import { ScalingTab } from "@/components/experiments/scaling-tab"
import { LogsTab } from "@/components/experiments/logs-tab"
import type { Experiment, Instance, InstanceConfig } from "@/lib/api"

interface ExperimentTabsProps {
  experimentId: string
  experiment: Experiment | null
  instances: Instance[]
  configs: InstanceConfig[]
  onInstancesChange: (instances: Instance[]) => void
  onConfigsChange: (configs: InstanceConfig[]) => void
}

export function ExperimentTabs({
  experimentId,
  experiment,
  instances,
  configs,
  onInstancesChange,
  onConfigsChange,
}: ExperimentTabsProps) {
  const experimentConfigs = useMemo(() => {
    return configs.filter((c) => instances.some((inst) => inst.id === c.instanceId))
  }, [configs, instances])

  return (
    <Tabs defaultValue="topology" className="w-full">
      <TabsList className="h-8">
        <TabsTrigger value="topology" className="text-xs h-6 px-3">
          Topology
        </TabsTrigger>
        <TabsTrigger value="instances" className="text-xs h-6 px-3">
          Instances
        </TabsTrigger>
        <TabsTrigger value="scaling" className="text-xs h-6 px-3">
          Scaling
        </TabsTrigger>
        <TabsTrigger value="logs" className="text-xs h-6 px-3">
          Logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="topology" className="mt-3">
        {experiment && (
          <TopologyTab experiment={experiment} instances={instances} configs={experimentConfigs} />
        )}
      </TabsContent>

      <TabsContent value="instances" className="mt-3">
        <InstancesTab
          experimentId={experimentId}
          instances={instances}
          configs={experimentConfigs}
          onInstancesChange={onInstancesChange}
          onConfigsChange={onConfigsChange}
        />
      </TabsContent>

      <TabsContent value="scaling" className="mt-3">
        <ScalingTab
          experimentId={experimentId}
          instances={instances}
          allConfigs={configs}
          onConfigsChange={onConfigsChange}
        />
      </TabsContent>

      <TabsContent value="logs" className="mt-3">
        <LogsTab experimentId={experimentId} instances={instances} />
      </TabsContent>
    </Tabs>
  )
}
