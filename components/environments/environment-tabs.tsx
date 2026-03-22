"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopologyTab } from "@/components/environments/topology-tab"
import { ClustersTab } from "@/components/environments/deployments-tab"
import { InstancesTab } from "@/components/environments/instances-tab"
import { ScalingTab } from "@/components/environments/scaling-tab"
import { LogsTab } from "@/components/environments/logs-tab"
import { ConfigurationTab } from "@/components/environments/configuration-tab"
import type { Deployment, Environment, Instance, InstanceType, Provider, Template } from "@/lib/api/types"

interface EnvironmentTabsProps {
  environmentId: string
  projectId: string
  environment: Environment | null
  deployments: Deployment[]
  instancesByCluster: Record<string, Instance[]>
  providers: Provider[]
  instanceTypes: InstanceType[]
  templates: Template[]
  isLoadingClusters?: boolean
  onClustersChange: (deployments: Deployment[]) => void
  onRefreshClusters: () => Promise<void>
}

export function EnvironmentTabs({
  environmentId,
  projectId,
  environment,
  deployments,
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
        <TabsTrigger value="deployments" className="text-xs h-6 px-3">
          Deployments
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
          <TopologyTab environment={environment} deployments={deployments} instancesByCluster={instancesByCluster} />
        )}
      </TabsContent>

      <TabsContent value="deployments" className="mt-3">
        <ClustersTab
          environmentId={environmentId}
          environment={environment}
          deployments={deployments}
          isLoading={isLoadingClusters}
          onClustersChange={onClustersChange}
          onRefresh={onRefreshClusters}
          onInstancesRefresh={async () => onRefreshClusters()}
        />
      </TabsContent>

      <TabsContent value="instances" className="mt-3">
        <InstancesTab
          deployments={deployments}
          instancesByCluster={instancesByCluster}
          isLoading={isLoadingClusters}
          onRefresh={onRefreshClusters}
        />
      </TabsContent>

      <TabsContent value="scaling" className="mt-3">
        <ScalingTab deployments={deployments} onClustersChange={onClustersChange} />
      </TabsContent>

      <TabsContent value="logs" className="mt-3">
        <LogsTab instances={allInstances} projectId={projectId} environmentId={environmentId} />
      </TabsContent>

      <TabsContent value="configuration" className="mt-3">
        {environment && <ConfigurationTab environment={environment} />}
      </TabsContent>
    </Tabs>
  )
}
