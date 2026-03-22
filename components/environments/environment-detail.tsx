"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { EnvironmentHeader } from "@/components/environments/environment-header"
import { EnvironmentTabs } from "@/components/environments/environment-tabs"
import { environmentsApi } from "@/lib/api/environments"
import { projectsApi } from "@/lib/api/projects"
import { deploymentsApi } from "@/lib/api/deployments"
import { resourcesApi } from "@/lib/api/resources"
import { providersApi } from "@/lib/api/providers"
import { templatesApi } from "@/lib/api/templates"
import type {
  Deployment,
  Environment,
  Project,
  Provider,
  ProvisionedResource,
  Template,
} from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

function normalizeDeployment(raw: any): Deployment {
  const status = (raw?.status ?? "provisioning").toString().toLowerCase()
  return {
    ...raw,
    id: String(raw?.id ?? ""),
    environment_id: raw?.environment_id ?? raw?.environmentId,
    environmentId: raw?.environment_id ?? raw?.environmentId,
    provider_id: raw?.provider_id ?? raw?.providerId,
    providerId: raw?.provider_id ?? raw?.providerId,
    providerName: raw?.provider_name ?? raw?.providerName,
    region: raw?.region ?? null,
    name: raw?.name,
    status,
    createdAt: raw?.created_at ?? raw?.createdAt,
    updatedAt: raw?.updated_at ?? raw?.updatedAt,
  }
}

function normalizeResource(raw: any, deploymentId?: string): ProvisionedResource {
  return {
    id: String(raw?.id ?? ""),
    deployment_id: raw?.deployment_id ?? raw?.deploymentId ?? deploymentId ?? "",
    provisioned_resource_type_id: raw?.provisioned_resource_type_id,
    resource_type: raw?.resource_type,
    provider_resource_id: raw?.provider_resource_id ?? null,
    name: raw?.name ?? null,
    status: (raw?.status ?? "PENDING").toString().toUpperCase(),
    health_status: raw?.health_status ?? null,
    last_health_check_at: raw?.last_health_check_at ?? null,
    public_ip: raw?.public_ip ?? null,
    private_ip: raw?.private_ip ?? null,
    metadata_json: raw?.metadata_json ?? null,
    created_at: raw?.created_at ?? raw?.createdAt,
    updated_at: raw?.updated_at ?? raw?.updatedAt,
  }
}

export function EnvironmentDetailView() {
  const params = useParams()
  const projectId = params.projectId as string
  const environmentId = params.environmentId as string
  const { currentOrg } = useAuth()

  const [environment, setEnvironment] = useState<Environment | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [resourcesByDeployment, setResourcesByDeployment] = useState<Record<string, ProvisionedResource[]>>({})
  const [providers, setProviders] = useState<Provider[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingResources, setIsLoadingResources] = useState(true)
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [isDestroyingEnv, setIsDestroyingEnv] = useState(false)
  const isRefreshingRef = useRef(false)

  const totalResources = Object.values(resourcesByDeployment).reduce(
    (sum, list) => sum + list.length,
    0
  )

  const loadResources = useCallback(
    async (targetDeployments: Deployment[], withLoading = true) => {
      if (withLoading) setIsLoadingResources(true)
      const entries = await Promise.all(
        targetDeployments.map(async (deployment) => {
          const raw = await resourcesApi
            .listByDeployment(deployment.id)
            .catch(() => [])
          return [
            deployment.id,
            raw.map((r: any) => normalizeResource(r, deployment.id)),
          ] as const
        })
      )
      if (withLoading) setIsLoadingResources(false)
      return Object.fromEntries(entries) as Record<string, ProvisionedResource[]>
    },
    []
  )

  const refreshEnvironmentData = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (isRefreshingRef.current) return
      isRefreshingRef.current = true
      setIsRefreshingStatus(true)

      try {
        const [environmentData, deploymentData] = await Promise.all([
          environmentsApi.get(projectId, environmentId).catch(() => null),
          deploymentsApi.list(environmentId).catch(() => []),
        ])

        const normalized = deploymentData.map((c: any) => normalizeDeployment(c))
        const map = await loadResources(normalized, !options.silent)

        if (environmentData) setEnvironment(environmentData)
        setDeployments(normalized)
        setResourcesByDeployment(map)
        setLastRefreshedAt(new Date())
      } catch {
        setDeployments([])
        setResourcesByDeployment({})
        if (!options.silent) setIsLoadingResources(false)
      } finally {
        isRefreshingRef.current = false
        setIsRefreshingStatus(false)
      }
    },
    [environmentId, loadResources, projectId]
  )

  const handleDestroyEnvironment = useCallback(async () => {
    setIsDestroyingEnv(true)
    try {
      await environmentsApi.terraformDestroy(projectId, environmentId)
      await refreshEnvironmentData({ silent: false })
    } catch {
      // error is visible via logs / status refresh
    } finally {
      setIsDestroyingEnv(false)
    }
  }, [projectId, environmentId, refreshEnvironmentData])

  useEffect(() => {
    let active = true

    async function loadEnvironment() {
      setIsLoading(true)
      try {
        const [environmentData, projectData, providerData, templateData] = await Promise.all([
          environmentsApi.get(projectId, environmentId),
          currentOrg ? projectsApi.get(currentOrg.id, projectId) : Promise.resolve(null),
          (currentOrg ? providersApi.list(String(currentOrg.id)) : Promise.resolve([])).catch(() => []),
          templatesApi.list().catch(() => []),
        ])
        const deploymentData = await deploymentsApi.list(environmentId).catch(() => [])
        const normalizedDeployments = deploymentData.map((c: any) => normalizeDeployment(c))
        const resourcesMap = await loadResources(normalizedDeployments)

        if (!active) return
        setEnvironment(environmentData)
        setProject(projectData)
        setProviders(providerData)
        setTemplates(templateData)
        setDeployments(normalizedDeployments)
        setResourcesByDeployment(resourcesMap)
        setLastRefreshedAt(new Date())
      } catch {
        if (active) {
          setEnvironment(null)
          setProject(null)
          setDeployments([])
          setResourcesByDeployment({})
        }
      } finally {
        if (active) setIsLoading(false)
        if (active) setIsLoadingResources(false)
      }
    }

    loadEnvironment()

    const intervalId = setInterval(() => {
      refreshEnvironmentData({ silent: true })
    }, 5000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [currentOrg, environmentId, projectId, loadResources, refreshEnvironmentData])

  if (!environment && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground">
        Environment not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <EnvironmentHeader
        projectId={projectId}
        project={project}
        environment={environment}
        resourcesCount={totalResources}
        isRefreshing={isRefreshingStatus}
        lastUpdatedAt={lastRefreshedAt}
        onDestroyEnvironment={handleDestroyEnvironment}
        isDestroying={isDestroyingEnv}
      />

      <EnvironmentTabs
        environmentId={environmentId}
        projectId={projectId}
        environment={environment}
        deployments={deployments}
        resourcesByDeployment={resourcesByDeployment}
        providers={providers}
        templates={templates}
        isLoadingResources={isLoadingResources}
        onDeploymentsChange={(next) => {
          const normalized = next.map((c: any) => normalizeDeployment(c))
          setDeployments(normalized)
          loadResources(normalized).then((map) => setResourcesByDeployment(map))
        }}
        onRefreshDeployments={() => refreshEnvironmentData({ silent: false })}
      />
    </div>
  )
}
