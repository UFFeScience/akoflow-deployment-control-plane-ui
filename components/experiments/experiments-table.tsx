import { DataTable } from "@/components/ui/data-table"
import type { Experiment } from "@/lib/api/types"
import { ExperimentRow } from "./experiment-row"

interface ExperimentsTableProps {
  projectId: string
  experiments: Experiment[]
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

export function ExperimentsTable({ projectId, experiments, isLoading = false }: ExperimentsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      isEmpty={!isLoading && experiments.length === 0}
      isLoading={isLoading}
      emptyLabel="No experiments yet. Create one to get started."
      loadingLabel="Loading experiments..."
    >
      {experiments.map((exp) => (
        <ExperimentRow key={exp.id} projectId={projectId} exp={exp} />
      ))}
    </DataTable>
  )
}
