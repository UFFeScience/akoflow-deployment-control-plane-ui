"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopologyTab } from "@/components/experiments/topology-tab"
import { ClustersTab } from "@/components/experiments/clusters-tab"
import { InstancesTab } from "@/components/experiments/instances-tab"
import { ScalingTab } from "@/components/experiments/scaling-tab"
import { LogsTab } from "@/components/experiments/logs-tab"
import type { Cluster, Experiment, Instance, InstanceType, Provider, Template } from "@/lib/api/types"

interface ExperimentTabsProps {
  experimentId: string
  experiment: Experiment | null
  clusters: Cluster[]
  instancesByCluster: Record<string, Instance[]>
  providers: Provider[]
  instanceTypes: InstanceType[]
  templates: Template[]
  isLoadingClusters?: boolean
  onClustersChange: (clusters: Cluster[]) => void
  onRefreshClusters: () => Promise<void>
}

export function ExperimentTabs({
  experimentId,
  experiment,
  clusters,
  instancesByCluster,
  providers,
  instanceTypes,
  templates,
  isLoadingClusters = false,
  onClustersChange,
  onRefreshClusters,
}: ExperimentTabsProps) {
  const allInstances = useMemo(() => Object.values(instancesByCluster).flat(), [instancesByCluster])

  return (
    <Tabs defaultValue="topology" className="w-full">
      <TabsList className="h-8">
        <TabsTrigger value="topology" className="text-xs h-6 px-3">
          Topology
        </TabsTrigger>
        <TabsTrigger value="clusters" className="text-xs h-6 px-3">
          Clusters
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
          <TopologyTab experiment={experiment} clusters={clusters} instancesByCluster={instancesByCluster} />
        )}
      </TabsContent>

      <TabsContent value="clusters" className="mt-3">
        <ClustersTab
          experimentId={experimentId}
          clusters={clusters}
          providers={providers}
          instanceTypes={instanceTypes}
          templates={templates}
          isLoading={isLoadingClusters}
          onClustersChange={onClustersChange}
          onRefresh={onRefreshClusters}
          onInstancesRefresh={async () => onRefreshClusters()}
        />
      </TabsContent>

      <TabsContent value="instances" className="mt-3">
        <InstancesTab
          clusters={clusters}
          instancesByCluster={instancesByCluster}
          isLoading={isLoadingClusters}
          onRefresh={onRefreshClusters}
        />
      </TabsContent>

      <TabsContent value="scaling" className="mt-3">
        <ScalingTab clusters={clusters} onClustersChange={onClustersChange} />
      </TabsContent>

      <TabsContent value="logs" className="mt-3">
        <LogsTab instances={allInstances} />
      </TabsContent>
    </Tabs>
  )
}
