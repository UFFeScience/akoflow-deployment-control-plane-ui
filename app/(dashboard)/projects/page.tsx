"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog"
import { ProjectsTable } from "@/components/projects/projects-table"
import { useAuth } from "@/contexts/auth-context"
import { projectsApi } from "@/lib/api"
import type { Project } from "@/lib/api"
import { toast } from "sonner"

export default function ProjectsPage() {
  const { currentOrg, organizations } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadProjects() {
      if (!currentOrg) {
        if (active) {
          setProjects([])
          setIsLoading(false)
        }
        return
      }
      setIsLoading(true)
      try {
        const data = await projectsApi.list(currentOrg.id)
        if (active) setProjects(data)
      } catch {
        if (active) setProjects([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadProjects()

    return () => {
      active = false
    }
  }, [currentOrg])

  function getOrgName(orgId: string) {
    return organizations.find((o) => o.id === orgId)?.name || orgId
  }

  async function handleCreate(data: { name: string; description: string; organizationId: string }) {
    try {
      const newProject = await projectsApi.create(data.organizationId, {
        name: data.name,
        description: data.description || undefined,
      })
      setProjects((prev) => [newProject, ...prev])
      toast.success("Project created")
    } catch {
      toast.error("Failed to create project")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Projects</h1>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          New Project
        </Button>
      </div>
      <ProjectsTable projects={projects} isLoading={isLoading} resolveOrgName={getOrgName} />

      <ProjectCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        organizations={organizations}
        defaultOrganizationId={currentOrg?.id}
        onSubmit={handleCreate}
      />
    </div>
  )
}
