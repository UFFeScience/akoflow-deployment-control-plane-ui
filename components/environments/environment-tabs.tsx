"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopologyTab } from "@/components/environments/topology-tab"
import { ClustersTab } from "@/components/environments/clusters-tab"
import { InstancesTab } from "@/components/environments/instances-tab"
import { ScalingTab } from "@/components/environments/scaling-tab"
import { LogsTab } from "@/components/environments/logs-tab"
import { ConfigurationTab } from "@/components/environments/configuration-tab"
import type { Cluster, Environment, Instance, InstanceType, Provider, Template } from "@/lib/api/types"

interface EnvironmentTabsProps {
  environmentId: string
  environment: Environment | null
  clusters: Cluster[]
  instancesByCluster: Record<string, Instance[]>
  providers: Provider[]
  instanceTypes: InstanceType[]
  templates: Template[]
  isLoadingClusters?: boolean
  onClustersChange: (clusters: Cluster[]) => void
  onRefreshClusters: () => Promise<void>
}

export function EnvironmentTabs({
  environmentId,
  environment,
  clusters,
  instancesByCluster,
  providers,
  instanceTypes,
  templates,
  isLoadingClusters = false,
  onClustersChange,
  onRefreshClusters,
}: EnvironmentTabsProps) {
  const allInstances = useMemo(() => Object.values(instancesByCluster).flat(), [instancesByCluster])
  const [activeTab, setActiveTab] = useState<string>("topology")

  return (
    <Tabs
      defaultValue="topology"
      value={activeTab}
      onValueChange={async (val) => {
        setActiveTab(val)
        await onRefreshClusters()
      }}
      className="w-full"
    >
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
        {environment && ((environment as any).environment_template_version_id || (environment as any).configuration_json) && (
          <TabsTrigger value="configuration" className="text-xs h-6 px-3">
            Configuration
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="topology" className="mt-3">
        {environment && (
          <TopologyTab environment={environment} clusters={clusters} instancesByCluster={instancesByCluster} />
        )}
      </TabsContent>

      <TabsContent value="clusters" className="mt-3">
        <ClustersTab
          environmentId={environmentId}
          environment={environment}
          clusters={clusters}
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

      <TabsContent value="configuration" className="mt-3">
        {environment && <ConfigurationTab environment={environment} />}
      </TabsContent>
    </Tabs>
  )
}
