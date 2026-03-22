"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopologyTab } from "@/components/environments/topology-tab"
import { DeploymentsTab } from "@/components/environments/deployments-tab"
import { ResourcesTab } from "@/components/environments/resources-tab"
import { LogsTab } from "@/components/environments/logs-tab"
import { ConfigurationTab } from "@/components/environments/configuration-tab"
import { IframeTab } from "@/components/environments/iframe-tab"
import type { Deployment, Environment, Provider, ProvisionedResource, Template } from "@/lib/api/types"

interface EnvironmentTabsProps {
  environmentId: string
  projectId: string
  environment: Environment | null
  deployments: Deployment[]
  resourcesByDeployment: Record<string, ProvisionedResource[]>
  providers: Provider[]
  templates: Template[]
  isLoadingResources?: boolean
  onDeploymentsChange: (deployments: Deployment[]) => void
  onRefreshDeployments: () => Promise<void>
}

export function EnvironmentTabs({
  environmentId,
  projectId,
  environment,
  deployments,
  resourcesByDeployment,
  providers,
  templates,
  isLoadingResources = false,
  onDeploymentsChange,
  onRefreshDeployments,
}: EnvironmentTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("topology")

  const allResources = Object.values(resourcesByDeployment).flat()

  return (
    <Tabs
      defaultValue="topology"
      value={activeTab}
      onValueChange={async (val) => {
        setActiveTab(val)
        await onRefreshDeployments()
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
        <TabsTrigger value="resources" className="text-xs h-6 px-3">
          Resources
        </TabsTrigger>
        <TabsTrigger value="logs" className="text-xs h-6 px-3">
          Logs
        </TabsTrigger>
        {environment &&
          ((environment as any).environment_template_version_id ||
            (environment as any).configuration_json) && (
            <TabsTrigger value="configuration" className="text-xs h-6 px-3">
              Configuration
            </TabsTrigger>
          )}
        {allResources.some((r) => r.metadata_json?.akoflow_iframe_url) && (
          <TabsTrigger value="preview" className="text-xs h-6 px-3">
            Preview
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="topology" className="mt-3">
        {environment && (
          <TopologyTab
            environment={environment}
            deployments={deployments}
            resourcesByDeployment={resourcesByDeployment}
          />
        )}
      </TabsContent>

      <TabsContent value="deployments" className="mt-3">
        <DeploymentsTab
          environmentId={environmentId}
          environment={environment}
          deployments={deployments}
          resourcesByDeployment={resourcesByDeployment}
          isLoading={isLoadingResources}
          onDeploymentsChange={onDeploymentsChange}
          onRefresh={onRefreshDeployments}
        />
      </TabsContent>

      <TabsContent value="resources" className="mt-3">
        <ResourcesTab
          deployments={deployments}
          resourcesByDeployment={resourcesByDeployment}
          isLoading={isLoadingResources}
          onRefresh={onRefreshDeployments}
        />
      </TabsContent>

      <TabsContent value="logs" className="mt-3">
        <LogsTab resources={allResources} projectId={projectId} environmentId={environmentId} />
      </TabsContent>

      <TabsContent value="configuration" className="mt-3">
        {environment && <ConfigurationTab environment={environment} />}
      </TabsContent>

      <TabsContent value="preview" className="mt-3">
        <IframeTab resources={allResources} />
      </TabsContent>
    </Tabs>
  )
}
