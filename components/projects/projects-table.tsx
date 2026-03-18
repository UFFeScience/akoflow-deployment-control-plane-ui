import { DataTable } from "@/components/ui/data-table"
import type { Project } from "@/lib/api/types"
import { ProjectRow } from "./project-row"

interface ProjectsTableProps {
  projects: Project[]
  isLoading?: boolean
  resolveOrgName?: (organizationId: string) => string
}

const defaultResolveOrgName = (orgId: string) => orgId

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "org", label: "Organization", className: "hidden sm:table-cell" },
  { key: "environments", label: "Environments" },
  { key: "created", label: "Created", className: "hidden md:table-cell" },
]

export function ProjectsTable({ projects, isLoading = false, resolveOrgName = defaultResolveOrgName }: ProjectsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      isEmpty={!isLoading && projects.length === 0}
      isLoading={isLoading}
      emptyLabel="No projects yet. Create one to get started."
      loadingLabel="Loading projects..."
    >
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} resolveOrgName={resolveOrgName} />
      ))}
    </DataTable>
  )
}
