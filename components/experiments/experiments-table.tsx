import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import type { Experiment } from "@/lib/api"

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
              <TableRow key={exp.id} className="h-9">
                <TableCell className="py-1.5">
                  <Link
                    href={`/projects/${projectId}/experiments/${exp.id}`}
                    className="text-xs font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {exp.name}
                  </Link>
                </TableCell>
                <TableCell className="py-1.5 hidden sm:table-cell">
                  {exp.templateName ? (
                    <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {exp.templateName.split(" ").slice(0, 2).join(" ")}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Custom</span>
                  )}
                </TableCell>
                <TableCell className="py-1.5">
                  <StatusBadge type="status" value={exp.status} />
                </TableCell>
                <TableCell className="py-1.5 hidden sm:table-cell text-xs text-muted-foreground">
                  {exp.instanceCount ?? 0}
                </TableCell>
                <TableCell className="py-1.5 hidden md:table-cell">
                  {(exp.awsInstanceCount ?? 0) > 0 ? (
                    <span className="text-[10px] font-medium text-orange-700 dark:text-orange-400">
                      {exp.awsInstanceCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="py-1.5 hidden md:table-cell">
                  {(exp.gcpInstanceCount ?? 0) > 0 ? (
                    <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
                      {exp.gcpInstanceCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="py-1.5 hidden lg:table-cell text-xs text-muted-foreground">
                  {exp.updatedAt ? new Date(exp.updatedAt).toLocaleDateString() : "--"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
