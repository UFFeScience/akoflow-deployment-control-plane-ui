"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ExperimentHeader } from "@/components/experiments/experiment-header"
import { ExperimentTabs } from "@/components/experiments/experiment-tabs"
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

  if (!experiment && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground">
        Experiment not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ExperimentHeader
        projectId={projectId}
        project={project}
        experiment={experiment}
        instancesCount={instances.length}
      />

      <ExperimentTabs
        experimentId={experimentId}
        experiment={experiment}
        instances={instances}
        configs={configs}
        onInstancesChange={setInstances}
        onConfigsChange={setConfigs}
      />
    </div>
  )
}
