"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"
import { TopologyTab } from "@/components/experiments/topology-tab"
import { InstancesTab } from "@/components/experiments/instances-tab"
import { ScalingTab } from "@/components/experiments/scaling-tab"
import { LogsTab } from "@/components/experiments/logs-tab"
import { experimentsApi, instancesApi, projectsApi } from "@/lib/api"
import type { Experiment, Instance, InstanceConfig, Project } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export default function ExperimentDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const experimentId = params.experimentId as string
  const { currentOrg } = useAuth()
  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [instances, setInstances] = useState<Instance[]>([])
  const [configs, setConfigs] = useState<InstanceConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadExperiment() {
      setIsLoading(true)
      try {
        const [experimentData, projectData, instanceData] = await Promise.all([
          experimentsApi.get(projectId, experimentId),
          currentOrg ? projectsApi.get(currentOrg.id, projectId) : Promise.resolve(null),
          instancesApi.list(experimentId).catch(() => []),
        ])
        if (!active) return
        setExperiment(experimentData)
        setProject(projectData)
        setInstances(instanceData)
        const instanceConfigs = instanceData.flatMap((inst) => inst.configs || [])
        setConfigs(instanceConfigs)
      } catch {
        if (active) {
          setExperiment(null)
          setProject(null)
          setInstances([])
          setConfigs([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadExperiment()

    return () => {
      active = false
    }
  }, [currentOrg, experimentId, projectId])

  const experimentConfigs = useMemo(() => {
    return configs.filter((c) => instances.some((inst) => inst.id === c.instanceId))
  }, [configs, instances])

  if (!experiment && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground">
        Experiment not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-xs text-muted-foreground h-6 px-2" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            {project?.name || "Project"}
          </Link>
        </Button>
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-foreground">{experiment?.name || "Experiment"}</h1>
          {experiment?.status && <StatusBadge type="status" value={experiment.status} />}
        </div>
        {experiment?.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{experiment.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
          {experiment?.templateName && (
            <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
              {experiment.templateName}
            </span>
          )}
          {experiment?.executionMode && <span className="capitalize">{experiment.executionMode} mode</span>}
          <span>{instances.length} instances</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="topology" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="topology" className="text-xs h-6 px-3">Topology</TabsTrigger>
          <TabsTrigger value="instances" className="text-xs h-6 px-3">Instances</TabsTrigger>
          <TabsTrigger value="scaling" className="text-xs h-6 px-3">Scaling</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs h-6 px-3">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="topology" className="mt-3">
          {experiment && (
            <TopologyTab
              experiment={experiment}
              instances={instances}
              configs={experimentConfigs}
            />
          )}
        </TabsContent>

        <TabsContent value="instances" className="mt-3">
          <InstancesTab
            experimentId={experimentId}
            instances={instances}
            configs={experimentConfigs}
            onInstancesChange={setInstances}
            onConfigsChange={setConfigs}
          />
        </TabsContent>

        <TabsContent value="scaling" className="mt-3">
          <ScalingTab
            experimentId={experimentId}
            instances={instances}
            allConfigs={configs}
            onConfigsChange={setConfigs}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-3">
          <LogsTab experimentId={experimentId} instances={instances} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
