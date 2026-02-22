"use client"

import { useState } from "react"
import { Plus, Trash2, Server } from "lucide-react"
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
import type { Instance, InstanceConfig } from "@/lib/api"
import { configApi, instancesApi } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface InstancesTabProps {
  experimentId: string
  instances: Instance[]
  configs: InstanceConfig[]
  onInstancesChange: (instances: Instance[]) => void
  onConfigsChange: (configs: InstanceConfig[]) => void
}

const providerRegions: Record<string, string[]> = {
  aws: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"],
  gcp: ["us-central1", "us-east1", "europe-west1", "asia-east1"],
}

const instanceTypes: Record<string, string[]> = {
  aws: ["p3.2xlarge", "p3.8xlarge", "c5.4xlarge", "m5.2xlarge", "g4dn.xlarge"],
  gcp: ["a2-highgpu-1g", "n1-standard-8", "n1-standard-16", "c2-standard-8"],
}

const typeSpecs: Record<string, { cpu: string; memory: string; gpu: string }> = {
  "p3.2xlarge": { cpu: "8 vCPU", memory: "61 GB", gpu: "1x NVIDIA V100" },
  "p3.8xlarge": { cpu: "32 vCPU", memory: "244 GB", gpu: "4x NVIDIA V100" },
  "c5.4xlarge": { cpu: "16 vCPU", memory: "32 GB", gpu: "None" },
  "m5.2xlarge": { cpu: "8 vCPU", memory: "32 GB", gpu: "None" },
  "g4dn.xlarge": { cpu: "4 vCPU", memory: "16 GB", gpu: "1x NVIDIA T4" },
  "a2-highgpu-1g": { cpu: "12 vCPU", memory: "85 GB", gpu: "1x NVIDIA A100" },
  "n1-standard-8": { cpu: "8 vCPU", memory: "30 GB", gpu: "1x NVIDIA T4" },
  "n1-standard-16": { cpu: "16 vCPU", memory: "60 GB", gpu: "None" },
  "c2-standard-8": { cpu: "8 vCPU", memory: "32 GB", gpu: "None" },
}

function ProviderColumn({
  provider,
  label,
  color,
  borderColor,
  instances,
  configs,
  onDelete,
}: {
  provider: string
  label: string
  color: string
  borderColor: string
  instances: Instance[]
  configs: InstanceConfig[]
  onDelete: (instId: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", color)}>{label}</span>
        <span className="text-[10px] text-muted-foreground">({instances.length})</span>
      </div>
      {instances.length === 0 ? (
        <div className="flex items-center justify-center rounded border border-dashed border-border py-6 text-[10px] text-muted-foreground">
          No {label} instances
        </div>
      ) : (
        <div className={cn("rounded-md border overflow-hidden", borderColor)}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="text-[10px] font-medium h-7">Type</TableHead>
                <TableHead className="text-[10px] font-medium h-7">Qty</TableHead>
                <TableHead className="text-[10px] font-medium h-7 hidden lg:table-cell">CPU</TableHead>
                <TableHead className="text-[10px] font-medium h-7 hidden lg:table-cell">Mem</TableHead>
                <TableHead className="text-[10px] font-medium h-7 hidden xl:table-cell">GPU</TableHead>
                <TableHead className="text-[10px] font-medium h-7">Status</TableHead>
                <TableHead className="text-[10px] font-medium h-7">Region</TableHead>
                <TableHead className="text-[10px] font-medium h-7 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((inst) => {
                const cfgs = configs.filter((c) => c.instanceId === inst.id)
                if (cfgs.length === 0) {
                  return (
                    <TableRow key={inst.id} className="h-8">
                      <TableCell className="py-1 text-[10px] text-muted-foreground" colSpan={5}>--</TableCell>
                      <TableCell className="py-1"><StatusBadge type="status" value={inst.status} /></TableCell>
                      <TableCell className="py-1 text-[10px] text-muted-foreground">{inst.region}</TableCell>
                      <TableCell className="py-1">
                        <button onClick={() => onDelete(inst.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                }
                return cfgs.map((cfg, idx) => (
                  <TableRow key={cfg.id} className="h-8">
                    <TableCell className="py-1 font-mono text-[10px] text-foreground">{cfg.instanceType}</TableCell>
                    <TableCell className="py-1 text-[10px]">{cfg.quantity}</TableCell>
                    <TableCell className="py-1 text-[10px] text-muted-foreground hidden lg:table-cell">{cfg.cpu}</TableCell>
                    <TableCell className="py-1 text-[10px] text-muted-foreground hidden lg:table-cell">{cfg.memory}</TableCell>
                    <TableCell className="py-1 text-[10px] text-muted-foreground hidden xl:table-cell">{cfg.gpu}</TableCell>
                    {idx === 0 && (
                      <>
                        <TableCell className="py-1" rowSpan={cfgs.length}><StatusBadge type="status" value={inst.status} /></TableCell>
                        <TableCell className="py-1 text-[10px] text-muted-foreground" rowSpan={cfgs.length}>{inst.region}</TableCell>
                        <TableCell className="py-1" rowSpan={cfgs.length}>
                          <button onClick={() => onDelete(inst.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export function InstancesTab({ experimentId, instances, configs, onInstancesChange, onConfigsChange }: InstancesTabProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ provider: "aws", region: "us-east-1", instanceType: "p3.2xlarge", quantity: 1 })
  const [saving, setSaving] = useState(false)

  const awsInstances = instances.filter((i) => i.provider === "aws")
  const gcpInstances = instances.filter((i) => i.provider === "gcp")

  async function handleDelete(instId: string) {
    try {
      await instancesApi.delete(experimentId, instId)
      onInstancesChange(instances.filter((i) => i.id !== instId))
      onConfigsChange(configs.filter((c) => c.instanceId !== instId))
      toast.success("Instance deleted")
    } catch {
      toast.error("Failed to delete instance")
    }
  }

  async function handleCreate() {
    setSaving(true)
    try {
      const newInst = await instancesApi.create(experimentId, {
        provider: form.provider,
        region: form.region,
      })
      const spec = typeSpecs[form.instanceType] || { cpu: "8 vCPU", memory: "32 GB", gpu: "None" }
      const newCfg = await configApi.create(newInst.id, {
        instanceType: form.instanceType,
        quantity: form.quantity,
        cpu: spec.cpu,
        memory: spec.memory,
        gpu: spec.gpu,
      })
      onInstancesChange([...instances, newInst])
      onConfigsChange([...configs, newCfg])
      setForm({ provider: "aws", region: "us-east-1", instanceType: "p3.2xlarge", quantity: 1 })
      setShowCreate(false)
      toast.success("Instance added")
    } catch {
      toast.error("Failed to add instance")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Instances ({instances.length})</span>
        <Button size="sm" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Add Instance
        </Button>
      </div>

      {instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <Server className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs font-medium text-foreground">No instances</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Add compute instances to run this experiment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ProviderColumn
            provider="aws"
            label="AWS"
            color="text-orange-700 dark:text-orange-400"
            borderColor="border-orange-200/60 dark:border-orange-800/40"
            instances={awsInstances}
            configs={configs}
            onDelete={handleDelete}
          />
          <ProviderColumn
            provider="gcp"
            label="GCP"
            color="text-blue-700 dark:text-blue-400"
            borderColor="border-blue-200/60 dark:border-blue-800/40"
            instances={gcpInstances}
            configs={configs}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Add Instance Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Add Instance</DialogTitle>
            <DialogDescription className="text-xs">Select provider, region, instance type, and quantity.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v, region: providerRegions[v]?.[0] || "", instanceType: instanceTypes[v]?.[0] || "" })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aws" className="text-xs">AWS</SelectItem>
                    <SelectItem value="gcp" className="text-xs">GCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Region</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(providerRegions[form.provider] || []).map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Instance Type</Label>
                <Select value={form.instanceType} onValueChange={(v) => setForm({ ...form, instanceType: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(instanceTypes[form.provider] || []).map((t) => (
                      <SelectItem key={t} value={t} className="text-xs font-mono">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            {typeSpecs[form.instanceType] && (
              <div className="rounded bg-muted/50 p-2 text-[10px] text-muted-foreground font-mono">
                {typeSpecs[form.instanceType].cpu} / {typeSpecs[form.instanceType].memory} / {typeSpecs[form.instanceType].gpu}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" className="text-xs" onClick={handleCreate} disabled={saving}>Add Instance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
