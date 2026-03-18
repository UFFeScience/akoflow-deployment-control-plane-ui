"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { FolderKanban, Globe, Layers } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { environmentsApi } from "@/lib/api/environments"
import type { Environment } from "@/lib/api/types"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

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

function ProjectGroup({
  projectId,
  projectName,
  environments,
}: {
  projectId: string
  projectName: string
  environments: Environment[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Project header */}
      <Link
        href={`/projects/${projectId}`}
        className="flex items-center gap-2 px-1 py-1 rounded hover:text-primary transition-colors group"
      >
        <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
          {projectName}
        </span>
        <span className="text-[10px] text-muted-foreground">({environments.length})</span>
      </Link>

      {/* Environments indented under project */}
      <div className="flex flex-col gap-1 pl-5 border-l border-border ml-1.5">
        {environments.map((env) => (
          <EnvironmentCard key={env.id} env={env} />
        ))}
      </div>
    </div>
  )
}

export function AllEnvironmentsList() {
  const { currentOrg } = useAuth()
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      if (!currentOrg) {
        if (active) {
          setEnvironments([])
          setIsLoading(false)
        }
        return
      }
      setIsLoading(true)
      try {
        const data = await environmentsApi.listAll(currentOrg.id)
        if (active) setEnvironments(data)
      } catch {
        if (active) {
          setEnvironments([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [currentOrg])

  // Group environments by project
  const groups = useMemo(() => {
    const map = new Map<string, { projectName: string; envs: Environment[] }>()
    for (const env of environments) {
      const pid = String(env.project_id ?? env.projectId ?? "")
      if (!map.has(pid)) {
        map.set(pid, { projectName: env.project_name ?? pid, envs: [] })
      }
      map.get(pid)!.envs.push(env)
    }
    return Array.from(map.entries()).map(([projectId, { projectName, envs }]) => ({
      projectId,
      projectName,
      environments: envs,
    }))
  }, [environments])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Environments</h1>
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

      {!isLoading && groups.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No environments yet"
          description="Environments are created inside projects. Navigate to a project to create one."
        />
      )}

      {!isLoading && groups.length > 0 && (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <ProjectGroup
              key={group.projectId}
              projectId={group.projectId}
              projectName={group.projectName}
              environments={group.environments}
            />
          ))}
        </div>
      )}
    </div>
  )
}
