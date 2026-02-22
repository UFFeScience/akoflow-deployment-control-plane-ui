"use client"

import { useEffect, useMemo, useState } from "react"
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

  const totalInstances = useMemo(
    () => Object.values(instancesByCluster).reduce((sum, list) => sum + list.length, 0),
    [instancesByCluster]
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
        const instancesMap = await loadInstances(clusterData)
        if (!active) return
        setExperiment(experimentData)
        setProject(projectData)
        setProviders(providerData)
        setInstanceTypes(instanceTypeData)
        setTemplates(templateData)
        setClusters(clusterData)
        setInstancesByCluster(instancesMap)
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

    return () => {
      active = false
    }
  }, [currentOrg, experimentId, projectId])

  async function loadInstances(targetClusters: Cluster[]) {
    setIsLoadingClusters(true)
    const entries = await Promise.all(
      targetClusters.map(async (cluster) => {
        const inst = await clustersApi.instances(cluster.id).catch(() => [])
        return [cluster.id, inst] as const
      })
    )
    const map = Object.fromEntries(entries) as Record<string, Instance[]>
    setIsLoadingClusters(false)
    return map
  }

  async function refreshClusters() {
    try {
      const data = await clustersApi.list(experimentId)
      setClusters(data)
      const map = await loadInstances(data)
      setInstancesByCluster(map)
    } catch {
      setClusters([])
      setInstancesByCluster({})
      setIsLoadingClusters(false)
    }
  }

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
          setClusters(next)
          loadInstances(next).then((map) => setInstancesByCluster(map))
        }}
        onRefreshClusters={refreshClusters}
      />
    </div>
  )
}
