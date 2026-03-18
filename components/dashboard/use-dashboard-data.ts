"use client"

import { useEffect, useMemo, useState } from "react"
import { environmentsApi } from "@/lib/api/environments"
import { projectsApi } from "@/lib/api/projects"
import { clustersApi } from "@/lib/api/clusters"
import type { Cluster, Environment, Instance, Project } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

interface DashboardData {
  projects: Project[]
  environments: Environment[]
  clusters: Cluster[]
  instances: Instance[]
  isLoading: boolean
  recentEnvironments: Environment[]
  totalProjects: number
  totalEnvironments: number
  runningInstances: number
  failedInstances: number
}

export function useDashboardData(): DashboardData {
  const { currentOrg } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!currentOrg) {
        if (active) {
          setProjects([])
          setEnvironments([])
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

        const environmentLists = await Promise.all(
          projectData.map((project) =>
            environmentsApi
              .list(project.id)
              .then((items) => items.map((exp) => ({ ...exp, projectId: exp.projectId || project.id })))
              .catch(() => [])
          )
        )
        const environmentData = environmentLists.flat()
        if (!active) return
        setEnvironments(environmentData)

        const clusterLists = await Promise.all(
          environmentData.map((exp) => clustersApi.list(exp.id).catch(() => []))
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
          setEnvironments([])
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

  const recentEnvironments = useMemo(() => {
    return [...environments].sort(
      (a, b) => new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime()
    )
  }, [environments])

  const totalProjects = projects.length
  const totalEnvironments = environments.length
  const runningInstances = instances.filter((i) => i.status === "running").length
  const failedInstances = instances.filter((i) => i.status === "failed").length

  return {
    projects,
    environments,
    clusters,
    instances,
    isLoading,
    recentEnvironments,
    totalProjects,
    totalEnvironments,
    runningInstances,
    failedInstances,
  }
}
