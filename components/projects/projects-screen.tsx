"use client"

import { useEffect, useState } from "react"
import { ProjectsHeader } from "@/components/projects/projects-header"
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog"
import { ProjectsTable } from "@/components/projects/projects-table"
import { useAuth } from "@/contexts/auth-context"
import { projectsApi } from "@/lib/api/projects"
import type { Project } from "@/lib/api/types"
import { toast } from "sonner"

export function ProjectsScreen() {
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
      <ProjectsHeader onNew={() => setShowCreate(true)} />
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
