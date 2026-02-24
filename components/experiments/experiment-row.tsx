import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import type { Experiment } from "@/lib/api/types"
import { ExperimentCellRenderers } from "./experiment-cell-renderers"

type ExperimentRowProps = {
  projectId: string
  exp: Experiment
}

export function ExperimentRow({ projectId, exp }: ExperimentRowProps) {
  const r = ExperimentCellRenderers

  return (
    <TableRow key={exp.id} className="h-9">
      <TableCell className="py-1.5">{r.name(exp, projectId)}</TableCell>
      <TableCell className="py-1.5 hidden sm:table-cell">{r.template(exp)}</TableCell>
      <TableCell className="py-1.5">{r.status(exp)}</TableCell>
      <TableCell className="py-1.5 hidden sm:table-cell text-xs text-muted-foreground">{r.instances(exp)}</TableCell>
      <TableCell className="py-1.5 hidden md:table-cell">{r.aws(exp)}</TableCell>
      <TableCell className="py-1.5 hidden md:table-cell">{r.gcp(exp)}</TableCell>
      <TableCell className="py-1.5 hidden lg:table-cell text-xs text-muted-foreground">{r.updated(exp)}</TableCell>
    </TableRow>
  )
}
