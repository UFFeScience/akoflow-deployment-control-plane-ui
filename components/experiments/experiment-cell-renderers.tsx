import Link from "next/link"
import { StatusBadge } from "@/components/status-badge"
import type { Experiment } from "@/lib/api/types"

type Renderers = {
  name: (exp: Experiment, projectId: string) => React.ReactNode
  template: (exp: Experiment) => React.ReactNode
  status: (exp: Experiment) => React.ReactNode
  instances: (exp: Experiment) => React.ReactNode
  aws: (exp: Experiment) => React.ReactNode
  gcp: (exp: Experiment) => React.ReactNode
  updated: (exp: Experiment) => React.ReactNode
}

export const ExperimentCellRenderers: Renderers = {
  name(exp, projectId) {
    return (
      <Link
        href={`/projects/${projectId}/experiments/${exp.id}`}
        className="text-xs font-medium text-foreground hover:text-primary transition-colors"
      >
        {exp.name}
      </Link>
    )
  },

  template(exp) {
    const name = exp.templateName || exp.template_name
    if (name) {
      return (
        <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {name.split(" ").slice(0, 2).join(" ")}
        </span>
      )
    }
    return <span className="text-[10px] text-muted-foreground">Custom</span>
  },

  status(exp) {
    return <StatusBadge type="status" value={exp.status} />
  },

  instances(exp) {
    return <span className="text-xs text-muted-foreground">{exp.instanceCount ?? 0}</span>
  },

  aws(exp) {
    return (exp.awsInstanceCount ?? 0) > 0 ? (
      <span className="text-[10px] font-medium text-orange-700 dark:text-orange-400">{exp.awsInstanceCount}</span>
    ) : (
      <span className="text-[10px] text-muted-foreground">0</span>
    )
  },

  gcp(exp) {
    return (exp.gcpInstanceCount ?? 0) > 0 ? (
      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">{exp.gcpInstanceCount}</span>
    ) : (
      <span className="text-[10px] text-muted-foreground">0</span>
    )
  },

  updated(exp) {
    return <span className="text-xs text-muted-foreground">{exp.updatedAt ? new Date(exp.updatedAt).toLocaleDateString() : "--"}</span>
  },
}
