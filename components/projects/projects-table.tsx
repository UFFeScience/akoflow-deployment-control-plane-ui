import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Project } from "@/lib/api/types"
import { ProjectRow } from "./project-row"

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
            projects.map((project) => <ProjectRow key={project.id} project={project} resolveOrgName={resolveOrgName} />)
          )}
        </TableBody>
      </Table>
    </div>
  )
}
