"use client"

import { useMemo, useState } from "react"
import { Plus, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import type { Cluster, InstanceType, Provider, Template } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/clusters"
import { toast } from "sonner"

interface ClustersTabProps {
  experimentId: string
  clusters: Cluster[]
  providers: Provider[]
  instanceTypes: InstanceType[]
  templates: Template[]
  isLoading?: boolean
  onClustersChange: (clusters: Cluster[]) => void
  onRefresh?: () => Promise<void>
  onInstancesRefresh?: (clusters: Cluster[]) => Promise<void>
}

export function ClustersTab({
  experimentId,
  clusters,
  providers,
  instanceTypes,
  templates,
  isLoading = false,
  onClustersChange,
  onRefresh,
  onInstancesRefresh,
}: ClustersTabProps) {
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDestroying, setIsDestroying] = useState(false)
  const healthyProviders = useMemo(() => providers.filter((p) => p.status !== "DOWN"), [providers])
  const [form, setForm] = useState({
    templateId: "none",
    providerId: healthyProviders[0]?.id || "",
    region: "",
    instanceTypeId: "",
    role: "",
    nodeCount: 1,
  })

  const filteredInstanceTypes = useMemo(
    () => instanceTypes.filter((it) => !form.providerId || it.providerId === form.providerId),
    [instanceTypes, form.providerId]
  )

  const regionOptions = useMemo(() => {
    const providerRegions = providers.find((p) => p.id === form.providerId)?.regions || []
    if (providerRegions.length > 0) return providerRegions
    const regionsFromTypes = filteredInstanceTypes.map((t) => t.region).filter(Boolean) as string[]
    return Array.from(new Set(regionsFromTypes))
  }, [providers, form.providerId, filteredInstanceTypes])

  function openDialog() {
    setForm({
      templateId: "none",
      providerId: healthyProviders[0]?.id || "",
      region: "",
      instanceTypeId: "",
      role: "",
      nodeCount: 1,
    })
    setOpen(true)
  }

  async function handleCreate() {
    if (!form.providerId || !form.region || !form.instanceTypeId || form.nodeCount <= 0) return
    setIsSaving(true)
    try {
      const payload = {
        templateId: form.templateId === "none" ? undefined : form.templateId,
        providerId: form.providerId,
        region: form.region,
        instanceTypeId: form.instanceTypeId,
        role: form.role || undefined,
        nodeCount: form.nodeCount,
      }
      const newCluster = await clustersApi.create(experimentId, payload)
      const next = [newCluster, ...clusters]
      onClustersChange(next)
      await onInstancesRefresh?.(next)
      toast.success("Cluster created")
      setOpen(false)
    } catch {
      toast.error("Failed to create cluster")
    } finally {
      setIsSaving(false)
    }
  }

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
        <Button size="sm" className="h-7 text-xs" onClick={openDialog}>
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
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">{cluster.instanceType || cluster.instanceTypeId}</TableCell>
                  <TableCell className="py-1.5 text-[11px] text-muted-foreground">{cluster.nodeCount}</TableCell>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Create cluster</DialogTitle>
            <DialogDescription className="text-xs">Select provider, template, and capacity to provision a new cluster.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Template (optional)</Label>
              <Select value={form.templateId} onValueChange={(v) => setForm((prev) => ({ ...prev, templateId: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="No template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Provider</Label>
                <Select
                  value={form.providerId}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, providerId: v, region: "", instanceTypeId: "" }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {healthyProviders.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Region</Label>
                {regionOptions.length > 0 ? (
                  <Select value={form.region} onValueChange={(v) => setForm((prev) => ({ ...prev, region: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionOptions.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="h-8 text-xs"
                    placeholder="e.g. us-east-1"
                    value={form.region}
                    onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Instance type</Label>
                <Select
                  value={form.instanceTypeId}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, instanceTypeId: v }))}
                  disabled={!form.providerId}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredInstanceTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Role</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="worker / trainer"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Node count</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={form.nodeCount}
                onChange={(e) => setForm((prev) => ({ ...prev, nodeCount: Math.max(1, parseInt(e.target.value) || 1) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={handleCreate}
              disabled={isSaving || !form.providerId || !form.region || !form.instanceTypeId}
            >
              {isSaving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDestroy(confirmId)}
        title="Destroy cluster?"
        description="This will terminate all instances under this cluster."
        loading={isDestroying}
      />
    </div>
  )
}
