import { TableCell, TableRow } from "@/components/ui/table"
import type { Project } from "@/lib/api/types"
import { ProjectCellRenderers } from "./project-cell-renderers"

type ProjectRowProps = {
  project: Project
  resolveOrgName: (id: string) => string
}

export function ProjectRow({ project, resolveOrgName }: ProjectRowProps) {
  const r = ProjectCellRenderers

  return (
    <TableRow key={project.id} className="h-9">
      <TableCell className="py-1.5">{r.name(project)}</TableCell>
      <TableCell className="py-1.5 hidden sm:table-cell text-xs text-muted-foreground">{r.organization(project, resolveOrgName)}</TableCell>
      <TableCell className="py-1.5 text-xs text-muted-foreground">{r.environments(project)}</TableCell>
      <TableCell className="py-1.5 hidden md:table-cell text-xs text-muted-foreground">{r.created(project)}</TableCell>
    </TableRow>
  )
}
