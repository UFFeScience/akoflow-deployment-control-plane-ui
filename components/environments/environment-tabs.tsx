"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopologyTab } from "@/components/environments/topology-tab"
import { DeploymentsTab } from "@/components/environments/deployments-tab"
import { ResourcesTab } from "@/components/environments/resources-tab"
import { LogsTab } from "@/components/environments/logs-tab"
import { ConfigurationTab } from "@/components/environments/configuration-tab"
import { IframeTab } from "@/components/environments/iframe-tab"
import { RunbooksTab } from "@/components/environments/runbooks-tab"
import { environmentsApi } from "@/lib/api/environments"
import type { RunbookRunOption } from "@/components/environments/logs-filters"
import type { Deployment, Environment, Provider, ProvisionedResource, Template } from "@/lib/api/types"

interface EnvironmentTabsProps {
  environmentId: string
  projectId: string
  environment: Environment | null
  deployments: Deployment[]
  resourcesByDeployment: Record<string, ProvisionedResource[]>
  providers: Provider[]
  templates: Template[]
  activeProviders?: Array<{ id: string; slug: string; name: string }>
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
  activeProviders,
  isLoadingResources = false,
  onDeploymentsChange,
  onRefreshDeployments,
}: EnvironmentTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("deployments")
  const [runbookRuns, setRunbookRuns] = useState<RunbookRunOption[]>([])

  const allResources = Object.values(resourcesByDeployment).flat()

  // Load runbook runs once — used to populate the Logs tab selector
  useEffect(() => {
    environmentsApi
      .listRunbookRuns(projectId, environmentId)
      .then((runs) => {
        setRunbookRuns(
          runs.map((r) => ({
            id: String(r.id),
            label: `${r.runbook_name ?? "Runbook"} · ${r.created_at ? new Date(r.created_at).toLocaleString() : String(r.id)}`,
          }))
        )
      })
      .catch(() => { })
  }, [projectId, environmentId])

  // Resolve template IDs — the API may omit templateId, fall back to matching by name
  const resolvedTemplateId: string | null = (() => {
    if (!environment) return null
    const direct = (environment as any).templateId ?? (environment as any).template_id
    if (direct) return String(direct)
    const byName = (environment.templateName ?? (environment as any).template_name) as string | undefined
    if (byName) {
      const found = templates.find((t) => t.name === byName)
      if (found) return found.id
    }
    return null
  })()

  const resolvedVersionId: string | null = (() => {
    if (!environment) return null
    const direct =
      (environment as any).environment_template_version_id ??
      (environment as any).environmentTemplateVersionId
    if (direct) return String(direct)
    if (resolvedTemplateId) {
      const tmpl = templates.find((t) => t.id === resolvedTemplateId)
      const active = tmpl?.active_version?.id
      if (active) return String(active)
    }
    return null
  })()

  return (
    <Tabs
      defaultValue="deployments"
      value={activeTab}
      onValueChange={async (val) => {
        setActiveTab(val)
        await onRefreshDeployments()
      }}
      className="w-full"
    >
      <TabsList className="h-8">

        <TabsTrigger value="deployments" className="text-xs h-6 px-3">
          Deployments
        </TabsTrigger>
        <TabsTrigger value="resources" className="text-xs h-6 px-3">
          Resources
        </TabsTrigger>
        <TabsTrigger value="logs" className="text-xs h-6 px-3">
          Logs
        </TabsTrigger>
        <TabsTrigger value="topology" className="text-xs h-6 px-3">
          Topology
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
            Workflow Engine
          </TabsTrigger>
        )}
        {resolvedTemplateId && resolvedVersionId && (
          <TabsTrigger value="runbooks" className="text-xs h-6 px-3">
            Runbooks
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="deployments" className="mt-3">
        <DeploymentsTab
          environmentId={environmentId}
          projectId={projectId}
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
        <LogsTab resources={allResources} projectId={projectId} environmentId={environmentId} runbookRuns={runbookRuns} />
      </TabsContent>

      <TabsContent value="configuration" className="mt-3">
        {environment && <ConfigurationTab environment={environment} activeProviders={activeProviders} />}
      </TabsContent>

      <TabsContent value="preview" className="mt-3">
        <IframeTab resources={allResources} />
      </TabsContent>

      <TabsContent value="runbooks" className="mt-3">
        {environment && resolvedTemplateId && resolvedVersionId && (
          <RunbooksTab
            projectId={projectId}
            environmentId={environmentId}
            templateId={resolvedTemplateId}
            versionId={resolvedVersionId}
            deployments={deployments}
            environment={environment}
            resourcesByDeployment={resourcesByDeployment}
          />
        )}
      </TabsContent>

      <TabsContent value="topology" className="mt-3">
        {environment && (
          <TopologyTab
            environment={environment}
            deployments={deployments}
            resourcesByDeployment={resourcesByDeployment}
            templateId={resolvedTemplateId}
            templateVersionId={resolvedVersionId}
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
