import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-state"
import type { Environment, Project } from "@/lib/api/types"

interface EnvironmentHeaderProps {
  projectId: string
  project: Project | null
  environment: Environment | null
  resourcesCount: number
  isRefreshing?: boolean
  lastUpdatedAt?: Date | null
  onDestroyEnvironment?: () => Promise<void>
  isDestroying?: boolean
}

export function EnvironmentHeader({
  projectId,
  project,
  environment,
  resourcesCount,
  isRefreshing = false,
  lastUpdatedAt,
}: EnvironmentHeaderProps) {
  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(lastUpdatedAt)
    : null

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-xs text-muted-foreground h-6 px-2" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            {project?.name || "Project"}
          </Link>
        </Button>
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-foreground">{environment?.name || "Environment"}</h1>
          {environment?.status && <StatusBadge type="status" value={environment.status} />}
        </div>
        {environment?.description && <p className="text-xs text-muted-foreground mt-0.5">{environment.description}</p>}
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
          {(environment?.templateName || environment?.template_name) && (
            <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
              {environment.templateName || environment.template_name}
            </span>
          )}
          {(environment?.executionMode || (environment as any)?.execution_mode) && (
            <span className="capitalize">{environment?.executionMode || (environment as any)?.execution_mode} mode</span>
          )}
          <span>{resourcesCount} resource{resourcesCount !== 1 ? "s" : ""}</span>
        </div>
        {environment?.status?.toLowerCase() !== "failed" && (
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold uppercase tracking-wide text-[9px] text-emerald-600">Live</span>
            {isRefreshing && <LoadingSpinner size="sm" className="text-muted-foreground" />}
            <span>Refreshing every 5s</span>
            {lastUpdatedLabel && <span className="text-[9px]">Last update {lastUpdatedLabel}</span>}
          </div>
        )}
      </div>


    </div>
  )
}
