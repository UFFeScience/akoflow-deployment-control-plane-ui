"use client"

import { useEffect, useMemo, useState } from "react"
import { experimentsApi } from "@/lib/api/experiments"
import { projectsApi } from "@/lib/api/projects"
import { clustersApi } from "@/lib/api/clusters"
import type { Cluster, Experiment, Instance, Project } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

interface DashboardData {
  projects: Project[]
  experiments: Experiment[]
  clusters: Cluster[]
  instances: Instance[]
  isLoading: boolean
  recentExperiments: Experiment[]
  totalProjects: number
  totalExperiments: number
  runningInstances: number
  failedInstances: number
}

export function useDashboardData(): DashboardData {
  const { currentOrg } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!currentOrg) {
        if (active) {
          setProjects([])
          setExperiments([])
          setClusters([])
          setInstances([])
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      try {
        const projectData = await projectsApi.list(currentOrg.id)
        if (!active) return
        setProjects(projectData)

        const experimentLists = await Promise.all(
          projectData.map((project) =>
            experimentsApi
              .list(project.id)
              .then((items) => items.map((exp) => ({ ...exp, projectId: exp.projectId || project.id })))
              .catch(() => [])
          )
        )
        const experimentData = experimentLists.flat()
        if (!active) return
        setExperiments(experimentData)

        const clusterLists = await Promise.all(
          experimentData.map((exp) => clustersApi.list(exp.id).catch(() => []))
        )
        const clusterData = clusterLists.flat()
        if (!active) return
        setClusters(clusterData)

        const instanceLists = await Promise.all(
          clusterData.map((cluster) => clustersApi.instances(cluster.id).catch(() => []))
        )
        if (!active) return
        setInstances(instanceLists.flat())
      } catch {
        if (active) {
          setProjects([])
          setExperiments([])
          setClusters([])
          setInstances([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [currentOrg])

  const recentExperiments = useMemo(() => {
    return [...experiments].sort(
      (a, b) => new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime()
    )
  }, [experiments])

  const totalProjects = projects.length
  const totalExperiments = experiments.length
  const runningInstances = instances.filter((i) => i.status === "running").length
  const failedInstances = instances.filter((i) => i.status === "failed").length

  return {
    projects,
    experiments,
    clusters,
    instances,
    isLoading,
    recentExperiments,
    totalProjects,
    totalExperiments,
    runningInstances,
    failedInstances,
  }
}
