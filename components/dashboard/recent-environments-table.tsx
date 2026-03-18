"use client"

import Link from "next/link"
import { DataTable } from "@/components/ui/data-table"
import { TableCell, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { CloudBadgeGroup } from "@/components/ui/cloud-badge"
import type { Environment, Project } from "@/lib/api/types"

interface RecentEnvironmentsTableProps {
  environments: Environment[]
  projects: Project[]
  isLoading: boolean
}

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "project", label: "Project" },
  { key: "status", label: "Status" },
  { key: "instances", label: "Instances", className: "hidden sm:table-cell" },
  { key: "cloud", label: "Cloud", className: "hidden md:table-cell" },
  { key: "updated", label: "Updated", className: "hidden lg:table-cell" },
]

export function RecentEnvironmentsTable({ environments, projects, isLoading }: RecentEnvironmentsTableProps) {
  function getProjectName(projectId: string) {
    return projects.find((p) => p.id === projectId)?.name || projectId
  }

  return (
    <div>
      <h2 className="text-xs font-medium text-muted-foreground mb-2">Recent Environments</h2>
      <DataTable
        columns={COLUMNS}
        isEmpty={!isLoading && environments.length === 0}
        isLoading={isLoading}
        emptyLabel="No environments yet."
        loadingLabel="Loading environments..."
      >
        {environments.map((exp) => (
          <TableRow key={exp.id} className="h-9">
            <TableCell className="py-1.5">
              <Link
                href={`/projects/${exp.projectId}/environments/${exp.id}`}
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
              <CloudBadgeGroup
                awsCount={exp.awsInstanceCount ?? 0}
                gcpCount={exp.gcpInstanceCount ?? 0}
              />
            </TableCell>
            <TableCell className="py-1.5 hidden lg:table-cell text-xs text-muted-foreground">
              {exp.updatedAt ? new Date(exp.updatedAt).toLocaleDateString() : "--"}
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </div>
  )
}

