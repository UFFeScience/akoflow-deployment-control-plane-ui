"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import WelcomeModal from "@/components/welcome-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { experimentsApi, instancesApi, projectsApi } from "@/lib/api"
import type { Experiment, Instance, Project } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { currentOrg } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const search = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const welcome = search?.get("welcome")
    if (welcome === "1") {
      setShowWelcome(true)
      // remove param from URL without reload
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
          projectData.map((project) => experimentsApi.list(project.id).catch(() => []))
        )
        const experimentData = experimentLists.flat()
        if (!active) return
        setExperiments(experimentData)

        const instanceLists = await Promise.all(
          experimentData.map((exp) => instancesApi.list(exp.id).catch(() => []))
        )
        if (!active) return
        setInstances(instanceLists.flat())
      } catch {
        if (active) {
          setProjects([])
          setExperiments([])
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

  // Simple confetti: create small colored divs and animate them
  function runConfetti() {
    const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C792EA"]
    const container = document.createElement("div")
    container.className = "confetti-container pointer-events-none fixed inset-0 z-[200]"
    document.body.appendChild(container)

    for (let i = 0; i < 40; i++) {
      const el = document.createElement("div")
      el.style.position = "absolute"
      el.style.width = `${Math.random() * 8 + 6}px`
      el.style.height = `${Math.random() * 12 + 8}px`
      el.style.background = colors[Math.floor(Math.random() * colors.length)]
      el.style.left = `${Math.random() * 100}%`
      el.style.top = `-10%`
      el.style.opacity = "0.95"
      el.style.transform = `rotate(${Math.random() * 360}deg)`
      el.style.borderRadius = "2px"
      el.style.transition = `transform 1.4s linear, top 1.4s linear, left 1.4s linear, opacity 0.6s linear`
      container.appendChild(el)
      // force layout
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetWidth
      const left = Math.random() * 100
      el.style.top = `${80 + Math.random() * 20}%`
      el.style.left = `${left}%`
      el.style.transform = `translateY(0) rotate(${Math.random() * 720}deg)`
    }

    setTimeout(() => {
      container.style.transition = "opacity 0.6s"
      container.style.opacity = "0"
      setTimeout(() => container.remove(), 800)
    }, 1400)
  }

  // confetti now handled by WelcomeModal

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

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>

      <WelcomeModal visible={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Compact inline metrics */}
      <div className="flex flex-wrap items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Projects</span>
          <span className="font-bold text-foreground">{totalProjects}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Experiments</span>
          <span className="font-bold text-foreground">{totalExperiments}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Running</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{runningInstances}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Failed</span>
          <span className="font-bold text-red-600 dark:text-red-400">{failedInstances}</span>
        </div>
      </div>

      {/* Recent experiments table */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground mb-2">Recent Experiments</h2>
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-[11px] font-medium h-8">Name</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Project</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Status</TableHead>
                <TableHead className="text-[11px] font-medium h-8 hidden sm:table-cell">Instances</TableHead>
                <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">Cloud</TableHead>
                <TableHead className="text-[11px] font-medium h-8 hidden lg:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentExperiments.map((exp) => (
                <TableRow key={exp.id} className="h-9">
                  <TableCell className="py-1.5">
                    <Link
                      href={`/projects/${exp.projectId}/experiments/${exp.id}`}
                      className="text-xs font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {exp.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Link
                      href={`/projects/${exp.projectId}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {getProjectName(exp.projectId)}
                    </Link>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <StatusBadge type="status" value={exp.status} />
                  </TableCell>
                  <TableCell className="py-1.5 hidden sm:table-cell text-xs text-muted-foreground">
                    {exp.instanceCount ?? 0}
                  </TableCell>
                  <TableCell className="py-1.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      {(exp.awsInstanceCount ?? 0) > 0 && (
                        <span className="inline-flex items-center rounded bg-orange-50 px-1 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                          AWS {exp.awsInstanceCount}
                        </span>
                      )}
                      {(exp.gcpInstanceCount ?? 0) > 0 && (
                        <span className="inline-flex items-center rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                          GCP {exp.gcpInstanceCount}
                        </span>
                      )}
                      {(exp.awsInstanceCount ?? 0) === 0 && (exp.gcpInstanceCount ?? 0) === 0 && (
                        <span className="text-[10px] text-muted-foreground">--</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 hidden lg:table-cell text-xs text-muted-foreground">
                    {exp.updatedAt ? new Date(exp.updatedAt).toLocaleDateString() : "--"}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && recentExperiments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                    No experiments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
