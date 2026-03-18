"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { FolderKanban, Globe, Layers, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog"
import { useAuth } from "@/contexts/auth-context"
import { projectsApi } from "@/lib/api/projects"
import { environmentsApi } from "@/lib/api/environments"
import type { Environment, Project } from "@/lib/api/types"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

function EnvironmentCard({ env }: { env: Environment }) {
  const projectId = env.project_id ?? env.projectId
  const templateName = env.template_name ?? env.templateName

  return (
    <Link
      href={`/projects/${projectId}/environments/${env.id}`}
      className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5 hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-foreground truncate">{env.name}</span>
          {templateName && (
            <span className="text-[10px] text-muted-foreground truncate">{templateName}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="hidden lg:block text-[10px] text-muted-foreground">
          {env.updated_at ? new Date(env.updated_at).toLocaleDateString() : "—"}
        </span>
        <StatusBadge type="status" value={env.status} />
      </div>
    </Link>
  )
}

export function ProjectsList() {
  const { currentOrg, organizations } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      if (!currentOrg) {
        if (active) {
          setProjects([])
          setEnvironments([])
          setIsLoading(false)
        }
        return
      }
      setIsLoading(true)
      try {
        const [projectData, envData] = await Promise.all([
          projectsApi.list(currentOrg.id),
          environmentsApi.listAll(currentOrg.id).catch(() => []),
        ])
        if (active) {
          setProjects(projectData)
          setEnvironments(envData)
        }
      } catch {
        if (active) {
          setProjects([])
          setEnvironments([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [currentOrg])

  // Map environments by project id
  const envsByProject = useMemo(() => {
    const map = new Map<string, Environment[]>()
    for (const env of environments) {
      const pid = String(env.project_id ?? env.projectId ?? "")
      if (!map.has(pid)) map.set(pid, [])
      map.get(pid)!.push(env)
    }
    return map
  }, [environments])

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
        <Button size="sm" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          New Project
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-6 w-40" />
              <div className="flex flex-col gap-1 pl-5 border-l border-border ml-1.5">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && projects.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No projects yet"
          description="Create a project to start organizing your environments."
        />
      )}

      {!isLoading && projects.length > 0 && (
        <div className="flex flex-col gap-6">
          {projects.map((project) => {
            const envs = envsByProject.get(String(project.id)) ?? []
            return (
              <div key={project.id} className="flex flex-col gap-1.5">
                {/* Project header */}
                <div className="flex items-center justify-between px-1 py-1">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-2 rounded hover:text-primary transition-colors group"
                  >
                    <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">({envs.length})</span>
                  </Link>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground" asChild>
                    <Link href={`/projects/${project.id}/environments/new`}>
                      <Plus className="mr-1 h-3 w-3" />
                      New Environment
                    </Link>
                  </Button>
                </div>

                {/* Environments under this project */}
                <div className="flex flex-col gap-1 pl-5 border-l border-border ml-1.5">
                  {envs.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground py-1">No environments yet.</p>
                  ) : (
                    envs.map((env) => <EnvironmentCard key={env.id} env={env} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

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
