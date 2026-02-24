import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Experiment } from "@/lib/api/types"
import { ExperimentRow } from "./experiment-row"

interface ExperimentsTableProps {
  projectId: string
  experiments: Experiment[]
  isLoading?: boolean
}

export function ExperimentsTable({ projectId, experiments, isLoading = false }: ExperimentsTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-[11px] font-medium h-8">Name</TableHead>
            <TableHead className="text-[11px] font-medium h-8 hidden sm:table-cell">Template</TableHead>
            <TableHead className="text-[11px] font-medium h-8">Status</TableHead>
            <TableHead className="text-[11px] font-medium h-8 hidden sm:table-cell">Instances</TableHead>
            <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">AWS</TableHead>
            <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">GCP</TableHead>
            <TableHead className="text-[11px] font-medium h-8 hidden lg:table-cell">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experiments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                {isLoading ? "Loading experiments..." : "No experiments yet. Create one to get started."}
              </TableCell>
            </TableRow>
          ) : (
            experiments.map((exp) => (
              <ExperimentRow key={exp.id} projectId={projectId} exp={exp} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
