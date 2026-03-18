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
import { clustersApi } from "@/lib/api/clusters"
import type { Cluster, Environment, Instance, Project } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

export function DashboardScreen() {
  const { currentOrg } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
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

  // Group instances by cluster
  const instancesByCluster = instances.reduce((acc, instance) => {
    const clusterId = instance.clusterId || "unknown"
    if (!acc[clusterId]) {
      acc[clusterId] = []
    }
    acc[clusterId].push(instance)
    return acc
  }, {} as Record<string, Instance[]>)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor your environments and instances</p>
      </div>

      <WelcomeModal visible={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Main Statistics */}
      <DashboardStats
        totalProjects={totalProjects}
        totalEnvironments={totalEnvironments}
        runningInstances={runningInstances}
        failedInstances={failedInstances}
        clusters={clusters}
        instances={instances}
        environments={environments}
      />

      {/* System Health */}
      <DashboardHealth environments={environments} clusters={clusters} />

      {/* Activity and Resources */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardActivity environments={environments} instances={instances} />
        
        <div className="space-y-6">
          <DashboardResources instances={instances} clusters={clusters} />
        </div>
      </div>

      {/* Recent Environments */}
      <RecentEnvironments recentEnvironments={recentEnvironments} isLoading={isLoading} getProjectName={getProjectName} />
    </div>
  )
}
