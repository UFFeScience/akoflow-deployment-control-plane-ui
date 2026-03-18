"use client"

import { DataTable } from "@/components/ui/data-table"
import { CloudBadge } from "@/components/ui/cloud-badge"
import { StatusBadge } from "@/components/status-badge"
import { TableCell, TableRow } from "@/components/ui/table"
import type { Instance } from "@/lib/api/types"

const COLUMNS = [
  { key: "instance", label: "Instance" },
  { key: "role", label: "Role" },
  { key: "provider", label: "Provider" },
  { key: "region", label: "Region" },
  { key: "status", label: "Status" },
  { key: "health", label: "Health" },
  { key: "publicIp", label: "Public IP" },
  { key: "privateIp", label: "Private IP" },
]

interface EnvironmentInstancesTableProps {
  instances: Instance[]
  isLoading?: boolean
}

export function EnvironmentInstancesTable({ instances, isLoading }: EnvironmentInstancesTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      isEmpty={instances.length === 0}
      isLoading={isLoading}
      emptyLabel="No instances found"
      loadingLabel="Loading instances..."
      colSpan={COLUMNS.length}
    >
      {instances.map((instance) => (
        <TableRow key={instance.id}>
          <TableCell className="font-mono text-xs text-muted-foreground">
            {String(instance.id).slice(0, 12)}…
          </TableCell>
          <TableCell className="text-sm capitalize">
            {instance.role ?? "—"}
          </TableCell>
          <TableCell>
            <CloudBadge provider={instance.provider} />
          </TableCell>
          <TableCell className="text-sm">{instance.region}</TableCell>
          <TableCell>
            <StatusBadge type="status" value={instance.status} />
          </TableCell>
          <TableCell className="text-sm capitalize">
            {instance.health ?? "—"}
          </TableCell>
          <TableCell className="font-mono text-xs">
            {instance.publicIp ?? "—"}
          </TableCell>
          <TableCell className="font-mono text-xs">
            {instance.privateIp ?? "—"}
          </TableCell>
        </TableRow>
      ))}
    </DataTable>
  )
}
