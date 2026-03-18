import { DataTable } from "@/components/ui/data-table"
import type { Environment } from "@/lib/api/types"
import { EnvironmentRow } from "./environment-row"

interface EnvironmentsTableProps {
  projectId: string
  environments: Environment[]
  isLoading?: boolean
}

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "template", label: "Template", className: "hidden sm:table-cell" },
  { key: "status", label: "Status" },
  { key: "instances", label: "Instances", className: "hidden sm:table-cell" },
  { key: "aws", label: "AWS", className: "hidden md:table-cell" },
  { key: "gcp", label: "GCP", className: "hidden md:table-cell" },
  { key: "updated", label: "Updated", className: "hidden lg:table-cell" },
]

export function EnvironmentsTable({ projectId, environments, isLoading = false }: EnvironmentsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      isEmpty={!isLoading && environments.length === 0}
      isLoading={isLoading}
      emptyLabel="No environments yet. Create one to get started."
      loadingLabel="Loading environments..."
    >
      {environments.map((exp) => (
        <EnvironmentRow key={exp.id} projectId={projectId} exp={exp} />
      ))}
    </DataTable>
  )
}
