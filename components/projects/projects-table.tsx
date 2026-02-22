import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Project } from "@/lib/api/types"

interface ProjectsTableProps {
  projects: Project[]
  isLoading?: boolean
  resolveOrgName?: (organizationId: string) => string
}

const defaultResolveOrgName = (orgId: string) => orgId

export function ProjectsTable({ projects, isLoading = false, resolveOrgName = defaultResolveOrgName }: ProjectsTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-[11px] font-medium h-8">Name</TableHead>
            <TableHead className="text-[11px] font-medium h-8 hidden sm:table-cell">Organization</TableHead>
            <TableHead className="text-[11px] font-medium h-8">Experiments</TableHead>
            <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                {isLoading ? "Loading projects..." : "No projects yet. Create one to get started."}
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id} className="h-9">
                <TableCell className="py-1.5">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-xs font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {project.name}
                  </Link>
                  {project.description && (
                    <p className="text-[10px] text-muted-foreground truncate max-w-xs">{project.description}</p>
                  )}
                </TableCell>
                <TableCell className="py-1.5 hidden sm:table-cell text-xs text-muted-foreground">
                  {resolveOrgName(project.organizationId)}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-muted-foreground">{project.experimentCount}</TableCell>
                <TableCell className="py-1.5 hidden md:table-cell text-xs text-muted-foreground">
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "--"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
