"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { RefreshCw, Server } from "lucide-react"
import type { Cluster, Instance } from "@/lib/api/types"

interface InstancesTabProps {
  clusters: Cluster[]
  instancesByCluster: Record<string, Instance[]>
  isLoading?: boolean
  onRefresh?: () => Promise<void>
}

export function InstancesTab({ clusters, instancesByCluster, isLoading = false, onRefresh }: InstancesTabProps) {
  const rows = clusters.flatMap((cluster) =>
    (instancesByCluster[cluster.id] || []).map((inst) => {
      const status = (inst.status || (inst as any).state || "").toString().toLowerCase()
      const health = (inst.health || (inst as any).health_status || "").toString().toLowerCase()
      const provider = (
        (inst as any).provider || (inst as any).provider_id || (inst as any).cloud_provider || cluster.providerId || cluster.providerName || ""
      )
        .toString()
        .toLowerCase()

      return {
        ...inst,
        status,
        health,
        provider,
        region: inst.region || cluster.region,
        publicIp: inst.publicIp ?? (inst as any).public_ip,
        privateIp: inst.privateIp ?? (inst as any).private_ip,
        instanceRole: inst.role || (inst as any).instance_role || (inst as any).role || cluster.role,
        clusterName: cluster.name || cluster.role || cluster.id,
        clusterRole: cluster.role,
        clusterStatus: cluster.status,
      }
    })
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Instances ({rows.length})</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => onRefresh?.()}
          disabled={isLoading}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <Server className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs font-medium text-foreground">No instances</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isLoading ? "Loading instances..." : "Clusters have not provisioned any instances yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-[11px] font-medium h-8">Cluster</TableHead>
                <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">Role</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Provider</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Region</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Status</TableHead>
                <TableHead className="text-[11px] font-medium h-8 hidden lg:table-cell">Health</TableHead>
                <TableHead className="text-[11px] font-medium h-8 hidden lg:table-cell">Public IP</TableHead>
                <TableHead className="text-[11px] font-medium h-8 hidden xl:table-cell">Private IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="h-9">
                  <TableCell className="py-1.5 text-xs font-medium text-foreground">{row.clusterName}</TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground hidden md:table-cell">{row.instanceRole || row.clusterRole || "--"}</TableCell>
                  <TableCell className="py-1.5"><StatusBadge type="provider" value={row.provider || "unknown"} /></TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">{row.region || "--"}</TableCell>
                  <TableCell className="py-1.5"><StatusBadge type="status" value={row.status || "pending"} /></TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground hidden lg:table-cell">{row.health || "--"}</TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground hidden lg:table-cell">{row.publicIp || "--"}</TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground hidden xl:table-cell">{row.privateIp || "--"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
