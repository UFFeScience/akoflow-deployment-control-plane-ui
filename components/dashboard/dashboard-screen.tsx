"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import WelcomeModal from "@/components/welcome-modal"
import { DashboardStats } from "./dashboard-stats"
import { DashboardActivity } from "./dashboard-activity"
import { DashboardResources } from "./dashboard-resources"
import { DashboardHealth } from "./dashboard-health"
import { InstancesVisualization } from "./instances-visualization"
import { RecentEnvironments } from "./recent-environments"
import { environmentsApi } from "@/lib/api/environments"
import { projectsApi } from "@/lib/api/projects"
import { deploymentsApi } from "@/lib/api/deployments"
import type { Deployment, Environment, Instance, Project } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

export function DashboardScreen() {
  const { currentOrg } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const search = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const welcome = search?.get("welcome")
    if (welcome === "1") {
      setShowWelcome(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("welcome")
      window.history.replaceState({}, "", url.toString())
    }

    let active = true

    async function loadDashboard() {
      if (!currentOrg) {
        if (active) {
          setProjects([])
          setEnvironments([])
          setDeployments([])
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

        const deploymentLists = await Promise.all(
          environmentData.map((exp) => deploymentsApi.list(exp.id).catch(() => []))
        )
        const deploymentData = deploymentLists.flat()
        if (!active) return
        setDeployments(deploymentData)

        const instanceLists = await Promise.all(
          deploymentData.map((deployment) => deploymentsApi.instances(deployment.id).catch(() => []))
        )
        if (!active) return
        setInstances(instanceLists.flat())
      } catch {
        if (active) {
          setProjects([])
          setEnvironments([])
          setDeployments([])
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
  }, [currentOrg, search, router])

  const recentEnvironments = useMemo(() => {
    return [...environments].sort((a, b) => new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime())
  }, [environments])

  function getProjectName(projectId: string) {
    return projects.find((p) => p.id === projectId)?.name || projectId
  }

  const totalProjects = projects.length
  const totalEnvironments = environments.length
  const runningInstances = instances.filter((i) => i.status === "running").length
  const failedInstances = instances.filter((i) => i.status === "failed").length

  const instancesByDeployment = instances.reduce((acc, instance) => {
    const deploymentId = instance.deploymentId || "unknown"
    if (!acc[deploymentId]) {
      acc[deploymentId] = []
    }
    acc[deploymentId].push(instance)
    return acc
  }, {} as Record<string, Instance[]>)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor your environments and instances</p>
      </div>

      <WelcomeModal visible={showWelcome} onClose={() => setShowWelcome(false)} />


      <DashboardStats
        totalProjects={totalProjects}
        totalEnvironments={totalEnvironments}
        runningInstances={runningInstances}
        failedInstances={failedInstances}
        deployments={deployments}
        instances={instances}
        environments={environments}
      />

 
    </div>
  )
}
