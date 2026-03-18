import Link from "next/link"
import type { Project } from "@/lib/api/types"

type ProjectRenderers = {
  name: (p: Project) => React.ReactNode
  organization: (p: Project, resolveOrgName: (id: string) => string) => React.ReactNode
  environments: (p: Project) => React.ReactNode
  created: (p: Project) => React.ReactNode
}

export const ProjectCellRenderers: ProjectRenderers = {
  name(p) {
    return (
      <div>
        <Link href={`/projects/${p.id}`} className="text-xs font-medium text-foreground hover:text-primary transition-colors">
          {p.name}
        </Link>
        {p.description && <p className="text-[10px] text-muted-foreground truncate max-w-xs">{p.description}</p>}
      </div>
    )
  },

  organization(p, resolveOrgName) {
    return <span className="text-xs text-muted-foreground">{resolveOrgName(p.organizationId)}</span>
  },

  environments(p) {
    return <span className="text-xs text-muted-foreground">{p.environmentCount}</span>
  },

  created(p) {
    return <span className="text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "--"}</span>
  },
}
