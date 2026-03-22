"use client"

import { useState } from "react"
import { Plus, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { CreateClusterDialog } from "./create-deployment-dialog"
import type { Deployment, Environment } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/deployments"
import { toast } from "sonner"

interface ClustersTabProps {
  environmentId: string
  environment?: Environment | null
  deployments: Deployment[]
  isLoading?: boolean
  onClustersChange: (deployments: Deployment[]) => void
  onRefresh?: () => Promise<void>
  onInstancesRefresh?: (deployments: Deployment[]) => Promise<void>
}

export function ClustersTab({
  environmentId,
  environment = null,
  deployments,
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
      const next = deployments.filter((c) => c.id !== clusterId)
      onClustersChange(next)
      await onInstancesRefresh?.(next)
      toast.success("Deployment destroyed")
    } catch {
      toast.error("Failed to destroy deployment")
    } finally {
      setIsDestroying(false)
      setConfirmId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Deployments ({deployments.length})</span>
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
          Create Deployment
        </Button>
      </div>

      {deployments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
          {isLoading ? "Loading deployments..." : "No deployments yet. Create one to start provisioning."}
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
              {deployments.map((deployment) => (
                <TableRow key={deployment.id} className="h-10">
                  <TableCell className="py-1.5 text-xs font-medium text-foreground">{deployment.name || deployment.id}</TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground hidden md:table-cell">{deployment.role || "--"}</TableCell>
                  <TableCell className="py-1.5"><StatusBadge type="provider" value={deployment.providerId} /></TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">{deployment.region}</TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">
                    {(deployment.instanceGroups || [])
                      .map((g) => `${g.instanceTypeId}${g.role ? ` (${g.role})` : ""} x${g.quantity ?? 0}`)
                      .join(", ") || deployment.instanceType || deployment.instanceTypeId || "--"}
                  </TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">{deployment.nodeCount ?? (deployment.instanceGroups || []).reduce((s, g) => s + (g.quantity ?? 0), 0) ?? "--"}</TableCell>
                  <TableCell className="py-1.5"><StatusBadge type="status" value={deployment.status} /></TableCell>
                  <TableCell className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] text-destructive"
                      onClick={() => setConfirmId(deployment.id)}
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
        title="Destroy deployment?"
        description="This will terminate all instances under this deployment."
        loading={isDestroying}
      />

      <CreateClusterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        environmentId={environmentId}
        environment={environment}
        onSuccess={async () => { await onRefresh?.() }}
      />
    </div>
  )
}
