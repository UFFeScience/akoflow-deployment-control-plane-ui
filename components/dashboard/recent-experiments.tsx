"use client"

import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import type { Experiment } from "@/lib/api/types"

type RecentExperimentsProps = {
  recentExperiments: Experiment[]
  isLoading: boolean
  getProjectName: (projectId: string) => string
}

export function RecentExperiments({ recentExperiments, isLoading, getProjectName }: RecentExperimentsProps) {
  return (
    <div>
      <h2 className="text-xs font-medium text-muted-foreground mb-2">Recent Experiments</h2>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[11px] font-medium h-8">Name</TableHead>
              <TableHead className="text-[11px] font-medium h-8">Project</TableHead>
              <TableHead className="text-[11px] font-medium h-8">Status</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden sm:table-cell">Instances</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">Cloud</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden lg:table-cell">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentExperiments.map((exp) => (
              <TableRow key={exp.id} className="h-9">
                <TableCell className="py-1.5">
                  <Link
                    href={`/projects/${exp.projectId}/experiments/${exp.id}`}
                    className="text-xs font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {exp.name}
                  </Link>
                </TableCell>
                <TableCell className="py-1.5">
                  <Link
                    href={`/projects/${exp.projectId}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {getProjectName(exp.projectId)}
                  </Link>
                </TableCell>
                <TableCell className="py-1.5">
                  <StatusBadge type="status" value={exp.status} />
                </TableCell>
                <TableCell className="py-1.5 hidden sm:table-cell text-xs text-muted-foreground">
                  {exp.instanceCount ?? 0}
                </TableCell>
                <TableCell className="py-1.5 hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    {(exp.awsInstanceCount ?? 0) > 0 && (
                      <span className="inline-flex items-center rounded bg-orange-50 px-1 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                        AWS {exp.awsInstanceCount}
                      </span>
                    )}
                    {(exp.gcpInstanceCount ?? 0) > 0 && (
                      <span className="inline-flex items-center rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        GCP {exp.gcpInstanceCount}
                      </span>
                    )}
                    {(exp.awsInstanceCount ?? 0) === 0 && (exp.gcpInstanceCount ?? 0) === 0 && (
                      <span className="text-[10px] text-muted-foreground">--</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1.5 hidden lg:table-cell text-xs text-muted-foreground">
                  {exp.updatedAt ? new Date(exp.updatedAt).toLocaleDateString() : "--"}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && recentExperiments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                  No experiments yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
