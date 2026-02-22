import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { Experiment, Project } from "@/lib/api"

interface ExperimentHeaderProps {
  projectId: string
  project: Project | null
  experiment: Experiment | null
  instancesCount: number
}

export function ExperimentHeader({ projectId, project, experiment, instancesCount }: ExperimentHeaderProps) {
  return (
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
      {experiment?.description && <p className="text-xs text-muted-foreground mt-0.5">{experiment.description}</p>}
      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
        {experiment?.templateName && (
          <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
            {experiment.templateName}
          </span>
        )}
        {experiment?.executionMode && <span className="capitalize">{experiment.executionMode} mode</span>}
        <span>{instancesCount} instances</span>
      </div>
    </div>
  )
}
