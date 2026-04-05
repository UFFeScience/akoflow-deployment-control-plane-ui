"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import WelcomeModal from "@/components/welcome-modal"
import ReviewerTutorialModal from "@/components/reviewer-tutorial-modal"
import { LocalProviderSetupModal } from "@/components/dashboard/local-provider-setup-modal"
import { providersApi } from "@/lib/api/providers"
import { DashboardStats } from "./dashboard-stats"
import { DashboardActivity } from "./dashboard-activity"
import { DashboardResources } from "./dashboard-resources"
import { DashboardHealth } from "./dashboard-health"
import { InstancesVisualization } from "./instances-visualization"
import { RecentEnvironments } from "./recent-environments"
import { environmentsApi } from "@/lib/api/environments"
import { projectsApi } from "@/lib/api/projects"
import { deploymentsApi } from "@/lib/api/deployments"
import { resourcesApi } from "@/lib/api/resources"
import type { Deployment, Environment, Project, ProvisionedResource } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

export function DashboardScreen() {
  const { currentOrg, user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [resources, setResources] = useState<ProvisionedResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const search = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeResolved, setWelcomeResolved] = useState(false)
  const [showLocalProviderSetup, setShowLocalProviderSetup] = useState(false)
  const [reviewerTutorialDismissed, setReviewerTutorialDismissed] = useState(false)

  useEffect(() => {
    const welcome = search?.get("welcome")
    if (welcome === "1") {
      setShowWelcome(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("welcome")
      window.history.replaceState({}, "", url.toString())
    }
    setWelcomeResolved(true)
  }, [search])

  // Auto-show local provider setup when no healthy provider credential exists yet
  // Only runs after the welcome modal has been fully resolved and dismissed
  useEffect(() => {
    if (!welcomeResolved || showWelcome) return
    if (typeof window === "undefined") return
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    if (!isLocal || !currentOrg) return

    async function checkAnyHealthyCredential() {
      try {
        const providers = await providersApi.list(String(currentOrg!.id)).catch(() => [] as any[])
        if (!providers || (providers as any[]).length === 0) {
          setShowLocalProviderSetup(true)
          return
        }

        // Check if any provider has at least one HEALTHY credential
        for (const provider of providers as any[]) {
          const creds = await providersApi.listCredentials(String(currentOrg!.id), String(provider.id)).catch(() => [] as any[])
          const hasHealthy = (creds as any[]).some((c: any) => c.health_status === "HEALTHY")
          if (hasHealthy) return // At least one healthy credential found — don't show modal
        }

        // No healthy credential anywhere — show local provider setup
        setShowLocalProviderSetup(true)
      } catch {}
    }

    checkAnyHealthyCredential()
  }, [currentOrg?.id, showWelcome, welcomeResolved])

  const showReviewerTutorial = !reviewerTutorialDismissed && !!user && user.email === "vldbreviewer@vldbreviewer"

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
    return [...environments].sort((a, b) => new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime())
  }, [environments])

  function getProjectName(projectId: string) {
    return projects.find((p) => p.id === projectId)?.name || projectId
  }

  const totalProjects = projects.length
  const totalEnvironments = environments.length

  const runningInstances = resources.filter((r) => r.status === "RUNNING").length
  const failedInstances = resources.filter((r) => r.status === "ERROR").length

  const instancesByDeployment = resources.reduce((acc, resource) => {
    const deploymentId = resource.deployment_id || resource.deploymentId || "unknown"
    if (!acc[deploymentId]) {
      acc[deploymentId] = []
    }
    acc[deploymentId].push(resource)
    return acc
  }, {} as Record<string, ProvisionedResource[]>)

  return (

    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor your environments and instances</p>
      </div>

      <WelcomeModal visible={showWelcome} onClose={() => setShowWelcome(false)} />
      <LocalProviderSetupModal visible={showLocalProviderSetup} onClose={() => setShowLocalProviderSetup(false)} />
      <ReviewerTutorialModal visible={showReviewerTutorial} onClose={() => setReviewerTutorialDismissed(true)} />

      <DashboardStats
        totalProjects={totalProjects}
        totalEnvironments={totalEnvironments}
        runningInstances={runningInstances}
        failedInstances={failedInstances}
        deployments={deployments}
        resources={resources}
        environments={environments}
      />

 
    </div>
  )
}
