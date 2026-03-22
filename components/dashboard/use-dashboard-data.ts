"use client"

import { useEffect, useMemo, useState } from "react"
import { environmentsApi } from "@/lib/api/environments"
import { projectsApi } from "@/lib/api/projects"
import { deploymentsApi } from "@/lib/api/deployments"
import { resourcesApi } from "@/lib/api/resources"
import type { Deployment, Environment, Project, ProvisionedResource } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

interface DashboardData {
  projects: Project[]
  environments: Environment[]
  deployments: Deployment[]
  resources: ProvisionedResource[]
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
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [resources, setResources] = useState<ProvisionedResource[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!currentOrg) {
        if (active) {
          setProjects([])
          setEnvironments([])
          setDeployments([])
          setResources([])
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

        const deploymentLists = await Promise.all(
          environmentData.map((exp) => deploymentsApi.list(exp.id).catch(() => []))
        )
        const deploymentData = deploymentLists.flat()
        if (!active) return
        setDeployments(deploymentData)

        const resourceLists = await Promise.all(
          deploymentData.map((deployment) => resourcesApi.listByDeployment(deployment.id).catch(() => []))
        )
        if (!active) return
        setResources(resourceLists.flat())
      } catch {
        if (active) {
          setProjects([])
          setEnvironments([])
          setDeployments([])
          setResources([])
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
  const runningInstances = resources.filter((r) => r.status === "RUNNING").length
  const failedInstances = resources.filter((r) => r.status === "ERROR").length

  return {
    projects,
    environments,
    deployments,
    resources,
    isLoading,
    recentEnvironments,
    totalProjects,
    totalEnvironments,
    runningInstances,
    failedInstances,
  }
}
