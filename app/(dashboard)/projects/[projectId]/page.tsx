"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExperimentCreateDialog } from "@/components/experiments/experiment-create-dialog"
import { ExperimentsTable } from "@/components/experiments/experiments-table"
import { experimentsApi } from "@/lib/api/experiments"
import { projectsApi } from "@/lib/api/projects"
import { templatesApi } from "@/lib/api/templates"
import type { Experiment, Project, Template } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { currentOrg } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProject() {
      if (!currentOrg) {
        if (active) {
          setProject(null)
          setExperiments([])
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      try {
        const [projectData, experimentData, templateData] = await Promise.all([
          projectsApi.get(currentOrg.id, projectId),
          experimentsApi.list(projectId).catch(() => []),
          templatesApi.list().catch(() => []),
        ])
        if (!active) return
        setProject(projectData)
        setExperiments(experimentData)
        setTemplates(templateData)
      } catch {
        if (active) {
          setProject(null)
          setExperiments([])
          setTemplates([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadProject()

    return () => {
      active = false
    }
  }, [currentOrg, projectId])

  if (!project && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground">
        Project not found.
      </div>
    )
  }

  async function handleCreate(data: { name: string; description: string; templateId?: string; executionMode: "manual" | "auto" }) {
    try {
      const newExp = await experimentsApi.create(projectId, {
        name: data.name,
        description: data.description || undefined,
        templateId: data.templateId,
        executionMode: data.executionMode,
      })
      setExperiments((prev) => [newExp, ...prev])
      toast.success("Experiment created")
    } catch {
      toast.error("Failed to create experiment")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-xs text-muted-foreground h-6 px-2" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Projects
          </Link>
        </Button>
        <h1 className="text-sm font-semibold text-foreground">{project?.name || "Project"}</h1>
        {project?.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground">Experiments</h2>
        <Button size="sm" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Create Experiment
        </Button>
      </div>
      <ExperimentsTable projectId={projectId} experiments={experiments} isLoading={isLoading} />

      <ExperimentCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        templates={templates}
        onSubmit={handleCreate}
      />
    </div>
  )
}
