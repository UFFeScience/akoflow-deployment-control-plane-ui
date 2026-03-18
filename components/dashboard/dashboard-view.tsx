"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import WelcomeModal from "@/components/welcome-modal"
import { DashboardMetrics } from "./dashboard-metrics"
import { RecentEnvironmentsTable } from "./recent-environments-table"
import { useDashboardData } from "./use-dashboard-data"

export function DashboardView() {
  const search = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)
  const {
    projects,
    recentEnvironments,
    isLoading,
    totalProjects,
    totalEnvironments,
    runningInstances,
    failedInstances,
  } = useDashboardData()

  useEffect(() => {
    const welcome = search?.get("welcome")
    if (welcome === "1") {
      setShowWelcome(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("welcome")
      window.history.replaceState({}, "", url.toString())
    }
  }, [search])

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>

      <WelcomeModal visible={showWelcome} onClose={() => setShowWelcome(false)} />

      <DashboardMetrics
        totalProjects={totalProjects}
        totalEnvironments={totalEnvironments}
        runningInstances={runningInstances}
        failedInstances={failedInstances}
      />

      <RecentEnvironmentsTable environments={recentEnvironments} projects={projects} isLoading={isLoading} />
    </div>
  )
}
