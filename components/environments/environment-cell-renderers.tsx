import Link from "next/link"
import { StatusBadge } from "@/components/status-badge"
import { CloudBadge } from "@/components/ui/cloud-badge"
import type { Environment } from "@/lib/api/types"

type Renderers = {
  name: (exp: Environment, projectId: string) => React.ReactNode
  template: (exp: Environment) => React.ReactNode
  status: (exp: Environment) => React.ReactNode
  instances: (exp: Environment) => React.ReactNode
  aws: (exp: Environment) => React.ReactNode
  gcp: (exp: Environment) => React.ReactNode
  updated: (exp: Environment) => React.ReactNode
}

export const EnvironmentCellRenderers: Renderers = {
  name(exp, projectId) {
    return (
      <Link
        href={`/projects/${projectId}/environments/${exp.id}`}
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
      <CloudBadge provider="aws" count={exp.awsInstanceCount} />
    ) : (
      <span className="text-[10px] text-muted-foreground">0</span>
    )
  },

  gcp(exp) {
    return (exp.gcpInstanceCount ?? 0) > 0 ? (
      <CloudBadge provider="gcp" count={exp.gcpInstanceCount} />
    ) : (
      <span className="text-[10px] text-muted-foreground">0</span>
    )
  },

  updated(exp) {
    return <span className="text-xs text-muted-foreground">{exp.updatedAt ? new Date(exp.updatedAt).toLocaleDateString() : "--"}</span>
  },
}
