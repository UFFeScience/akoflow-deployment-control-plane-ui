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
import { RecentExperiments } from "./recent-experiments"
import { experimentsApi } from "@/lib/api/experiments"
import { projectsApi } from "@/lib/api/projects"
import { clustersApi } from "@/lib/api/clusters"
import type { Cluster, Experiment, Instance, Project } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

export function DashboardScreen() {
  const { currentOrg } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
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
  }, [currentOrg, search, router])

  const recentExperiments = useMemo(() => {
    return [...experiments].sort((a, b) => new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime())
  }, [experiments])

  function getProjectName(projectId: string) {
    return projects.find((p) => p.id === projectId)?.name || projectId
  }

  const totalProjects = projects.length
  const totalExperiments = experiments.length
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
        <p className="text-sm text-muted-foreground mt-1">Monitor your experiments and instances</p>
      </div>

      <WelcomeModal visible={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Main Statistics */}
      <DashboardStats
        totalProjects={totalProjects}
        totalExperiments={totalExperiments}
        runningInstances={runningInstances}
        failedInstances={failedInstances}
        clusters={clusters}
        instances={instances}
        experiments={experiments}
      />

      {/* System Health */}
      <DashboardHealth experiments={experiments} clusters={clusters} />

      {/* Activity and Resources */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardActivity experiments={experiments} instances={instances} />
        
        <div className="space-y-6">
          <DashboardResources instances={instances} clusters={clusters} />
        </div>
      </div>

      {/* Recent Experiments */}
      <RecentExperiments recentExperiments={recentExperiments} isLoading={isLoading} getProjectName={getProjectName} />
    </div>
  )
}
