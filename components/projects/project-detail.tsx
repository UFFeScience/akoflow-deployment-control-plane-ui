"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EnvironmentsTable } from "@/components/environments/environments-table"
import { environmentsApi } from "@/lib/api/environments"
import { projectsApi } from "@/lib/api/projects"
import type { Environment, Project } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"

export function ProjectDetailView() {
  const params = useParams()
  const projectId = params.projectId as string
  const { currentOrg } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadProject() {
      if (!currentOrg) {
        if (active) {
          setProject(null)
          setEnvironments([])
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      try {
        const [projectData, environmentData] = await Promise.all([
          projectsApi.get(currentOrg.id, projectId),
          environmentsApi.list(projectId).catch(() => []),
        ])
        if (!active) return
        setProject(projectData)
        setEnvironments(environmentData)
      } catch {
        if (active) {
          setProject(null)
          setEnvironments([])
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
        <h2 className="text-xs font-medium text-muted-foreground">Environments</h2>
        <Button size="sm" className="h-7 text-xs" asChild>
          <Link href={`/projects/${projectId}/environments/new`}>
            <Plus className="mr-1 h-3 w-3" />
            Create Environment
          </Link>
        </Button>
      </div>
      <EnvironmentsTable projectId={projectId} environments={environments} isLoading={isLoading} />
    </div>
  )
}
