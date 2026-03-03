"use client"

import { useState } from "react"
import { Plus, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { CreateClusterDialog } from "./create-cluster-dialog"
import type { Cluster, Experiment } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/clusters"
import { toast } from "sonner"

interface ClustersTabProps {
  experimentId: string
  experiment?: Experiment | null
  clusters: Cluster[]
  isLoading?: boolean
  onClustersChange: (clusters: Cluster[]) => void
  onRefresh?: () => Promise<void>
  onInstancesRefresh?: (clusters: Cluster[]) => Promise<void>
}

export function ClustersTab({
  experimentId,
  experiment = null,
  clusters,
  isLoading = false,
  onClustersChange,
  onRefresh,
  onInstancesRefresh,
}: ClustersTabProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isDestroying, setIsDestroying] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  async function handleDestroy(clusterId: string) {
    setIsDestroying(true)
    try {
      await clustersApi.destroy(clusterId)
      const next = clusters.filter((c) => c.id !== clusterId)
      onClustersChange(next)
      await onInstancesRefresh?.(next)
      toast.success("Cluster destroyed")
    } catch {
      toast.error("Failed to destroy cluster")
    } finally {
      setIsDestroying(false)
      setConfirmId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Clusters ({clusters.length})</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onRefresh?.()}
            disabled={isLoading}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Create Cluster
        </Button>
      </div>

      {clusters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
          {isLoading ? "Loading clusters..." : "No clusters yet. Create one to start provisioning."}
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-[11px] font-medium h-8">Name</TableHead>
                <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">Role</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Provider</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Region</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Instance Type</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Nodes</TableHead>
                <TableHead className="text-[11px] font-medium h-8">Status</TableHead>
                <TableHead className="text-[11px] font-medium h-8 w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clusters.map((cluster) => (
                <TableRow key={cluster.id} className="h-10">
                  <TableCell className="py-1.5 text-xs font-medium text-foreground">{cluster.name || cluster.id}</TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground hidden md:table-cell">{cluster.role || "--"}</TableCell>
                  <TableCell className="py-1.5"><StatusBadge type="provider" value={cluster.providerId} /></TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">{cluster.region}</TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">
                    {(cluster.instanceGroups || [])
                      .map((g) => `${g.instanceTypeId}${g.role ? ` (${g.role})` : ""} x${g.quantity ?? 0}`)
                      .join(", ") || cluster.instanceType || cluster.instanceTypeId || "--"}
                  </TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">{cluster.nodeCount ?? (cluster.instanceGroups || []).reduce((s, g) => s + (g.quantity ?? 0), 0) ?? "--"}</TableCell>
                  <TableCell className="py-1.5"><StatusBadge type="status" value={cluster.status} /></TableCell>
                  <TableCell className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] text-destructive"
                      onClick={() => setConfirmId(cluster.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Destroy
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmationDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDestroy(confirmId)}
        title="Destroy cluster?"
        description="This will terminate all instances under this cluster."
        loading={isDestroying}
      />

      <CreateClusterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        experimentId={experimentId}
        experiment={experiment}
        onSuccess={async () => { await onRefresh?.() }}
      />
    </div>
  )
}
