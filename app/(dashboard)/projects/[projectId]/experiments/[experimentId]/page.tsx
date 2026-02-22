"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { ExperimentHeader } from "@/components/experiments/experiment-header"
import { ExperimentTabs } from "@/components/experiments/experiment-tabs"
import { experimentsApi } from "@/lib/api/experiments"
import { projectsApi } from "@/lib/api/projects"
import { clustersApi } from "@/lib/api/clusters"
import { providersApi } from "@/lib/api/providers"
import { instanceTypesApi } from "@/lib/api/instance-types"
import { templatesApi } from "@/lib/api/templates"
import type {
  Cluster,
  Experiment,
  Instance,
  InstanceType,
  Project,
  Provider,
  Template,
} from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

function normalizeStatus(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value.toLowerCase()
  return fallback
}

function normalizeCluster(raw: any): Cluster {
  const status = normalizeStatus(raw?.status, "creating") as Cluster["status"]
  const groups = (raw?.instance_groups || raw?.instanceGroups || []).map((g: any) => ({
    id: g?.id?.toString?.() ?? g?.id,
    clusterId: g?.cluster_id ?? g?.clusterId ?? raw?.id,
    instanceTypeId: g?.instance_type_id ?? g?.instanceTypeId,
    instanceTypeName: g?.instance_type_name ?? g?.instanceTypeName ?? g?.instance_type?.name,
    instanceType: g?.instance_type ?? g?.instanceType ?? g?.instance_type_name,
    role: g?.role,
    quantity: g?.quantity ?? 0,
    metadata: g?.metadata ?? g?.metadata_json ?? null,
    createdAt: g?.created_at ?? g?.createdAt,
    updatedAt: g?.updated_at ?? g?.updatedAt,
  }))
  const summedNodeCount = groups.reduce((sum: number, g: any) => sum + (Number(g.quantity) || 0), 0)

  return {
    ...raw,
    id: raw?.id?.toString?.() ?? raw?.id,
    experimentId: raw?.experimentId ?? raw?.experiment_id ?? raw?.experiment?.id,
    providerId: raw?.providerId ?? raw?.provider_id ?? raw?.provider ?? raw?.provider?.id,
    providerName: raw?.providerName ?? raw?.provider_name ?? raw?.provider_label ?? raw?.provider?.name,
    region: raw?.region,
    role: raw?.role,
    nodeCount: raw?.nodeCount ?? raw?.node_count ?? raw?.nodes ?? raw?.total_nodes ?? summedNodeCount,
    instanceTypeId: raw?.instanceTypeId ?? raw?.instance_type_id ?? raw?.instance_type?.id,
    instanceType: raw?.instanceType ?? raw?.instance_type ?? raw?.instance_type_name,
    instanceGroups: groups,
    status,
    createdAt: raw?.createdAt ?? raw?.created_at,
    updatedAt: raw?.updatedAt ?? raw?.updated_at,
  }
}

function normalizeInstance(raw: any, cluster?: Cluster): Instance {
  const status = normalizeStatus(raw?.status, "pending") as Instance["status"]
  const health = normalizeStatus(raw?.health ?? raw?.health_status, "")
  const provider = raw?.provider ?? raw?.provider_id ?? raw?.cloud_provider ?? cluster?.providerId ?? cluster?.providerName

  return {
    ...raw,
    id: raw?.id?.toString?.() ?? raw?.id,
    experimentId: raw?.experimentId ?? raw?.experiment_id ?? cluster?.experimentId,
    clusterId: raw?.clusterId ?? raw?.cluster_id ?? cluster?.id,
    instanceGroupId: raw?.instance_group_id ?? raw?.instanceGroupId,
    provider: typeof provider === "string" ? provider.toLowerCase() : provider,
    region: raw?.region ?? cluster?.region,
    role: raw?.role ?? raw?.instance_role ?? raw?.kind,
    status,
    health,
    publicIp: raw?.publicIp ?? raw?.public_ip ?? raw?.ip_public,
    privateIp: raw?.privateIp ?? raw?.private_ip ?? raw?.ip_private,
    createdAt: raw?.createdAt ?? raw?.created_at,
  } as Instance
}

export default function ExperimentDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const experimentId = params.experimentId as string
  const { currentOrg } = useAuth()
  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [instancesByCluster, setInstancesByCluster] = useState<Record<string, Instance[]>>({})
  const [providers, setProviders] = useState<Provider[]>([])
  const [instanceTypes, setInstanceTypes] = useState<InstanceType[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingClusters, setIsLoadingClusters] = useState(true)
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const isRefreshingRef = useRef(false)

  const totalInstances = useMemo(
    () => Object.values(instancesByCluster).reduce((sum, list) => sum + list.length, 0),
    [instancesByCluster]
  )

  const loadInstances = useCallback(async (targetClusters: Cluster[], withLoading = true) => {
    if (withLoading) setIsLoadingClusters(true)
    const entries = await Promise.all(
      targetClusters.map(async (cluster) => {
        const inst = await clustersApi.instances(cluster.id).catch(() => [])
        return [cluster.id, inst.map((item: any) => normalizeInstance(item, cluster))] as const
      })
    )
    const map = Object.fromEntries(entries) as Record<string, Instance[]>
    if (withLoading) setIsLoadingClusters(false)
    return map
  }, [])

  const refreshExperimentData = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (isRefreshingRef.current) return
      isRefreshingRef.current = true
      setIsRefreshingStatus(true)

      try {
        const [experimentData, clusterData] = await Promise.all([
          experimentsApi.get(projectId, experimentId).catch(() => null),
          clustersApi.list(experimentId).catch(() => []),
        ])

        const normalized = clusterData.map((c) => normalizeCluster(c))
        const map = await loadInstances(normalized, !options.silent)

        if (experimentData) setExperiment(experimentData)
        setClusters(normalized)
        setInstancesByCluster(map)
        setLastRefreshedAt(new Date())
      } catch {
        setClusters([])
        setInstancesByCluster({})
        if (!options.silent) setIsLoadingClusters(false)
      } finally {
        isRefreshingRef.current = false
        setIsRefreshingStatus(false)
      }
    },
    [experimentId, loadInstances, projectId]
  )

  useEffect(() => {
    let active = true

    async function loadExperiment() {
      setIsLoading(true)
      try {
        const [experimentData, projectData, providerData, instanceTypeData, templateData] = await Promise.all([
          experimentsApi.get(projectId, experimentId),
          currentOrg ? projectsApi.get(currentOrg.id, projectId) : Promise.resolve(null),
          providersApi.list().catch(() => []),
          instanceTypesApi.list().catch(() => []),
          templatesApi.list().catch(() => []),
        ])
        const clusterData = await clustersApi.list(experimentId).catch(() => [])
        const normalizedClusters = clusterData.map((c) => normalizeCluster(c))
        const instancesMap = await loadInstances(normalizedClusters)
        if (!active) return
        setExperiment(experimentData)
        setProject(projectData)
        setProviders(providerData)
        setInstanceTypes(
          instanceTypeData.map((it) => ({
            ...it,
            providerId: (it as any).providerId || (it as any).provider_id || (it as any).provider?.id || it.providerId,
            status: (it as any).status,
            vcpus: (it as any).vcpus ?? (it as any).cpu,
            memory: (it as any).memory ?? (it as any).memory_mb,
            gpu: (it as any).gpu ?? (it as any).gpu_count,
          }))
        )
        setTemplates(templateData)
        setClusters(normalizedClusters)
        setInstancesByCluster(instancesMap)
        setLastRefreshedAt(new Date())
      } catch {
        if (active) {
          setExperiment(null)
          setProject(null)
          setClusters([])
          setInstancesByCluster({})
        }
      } finally {
        if (active) setIsLoading(false)
        if (active) setIsLoadingClusters(false)
      }
    }

    loadExperiment()

    const intervalId = setInterval(() => {
      refreshExperimentData({ silent: true })
    }, 5000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [currentOrg, experimentId, projectId, loadInstances, refreshExperimentData])

  if (!experiment && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground">
        Experiment not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ExperimentHeader
        projectId={projectId}
        project={project}
        experiment={experiment}
        instancesCount={totalInstances}
        isRefreshing={isRefreshingStatus}
        lastUpdatedAt={lastRefreshedAt}
      />

      <ExperimentTabs
        experimentId={experimentId}
        experiment={experiment}
        clusters={clusters}
        instancesByCluster={instancesByCluster}
        providers={providers}
        instanceTypes={instanceTypes}
        templates={templates}
        isLoadingClusters={isLoadingClusters}
        onClustersChange={(next) => {
          const normalized = next.map((c) => normalizeCluster(c))
          setClusters(normalized)
          loadInstances(normalized).then((map) => setInstancesByCluster(map))
        }}
        onRefreshClusters={() => refreshExperimentData({ silent: false })}
      />
    </div>
  )
}
