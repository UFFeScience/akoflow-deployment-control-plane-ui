"use client"

import { useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Provider, InstanceType, Template } from "@/lib/api/types"

export interface ClusterFormData {
  templateId: string
  providerId: string
  region: string
  instanceGroups: {
    id: string
    instanceTypeId: string
    role: string
    quantity: number
    metadata: string
  }[]
}

interface ClusterFormFieldsProps {
  form: ClusterFormData
  onFormChange: (form: ClusterFormData) => void
  providers: Provider[]
  instanceTypes: InstanceType[]
  templates: Template[]
  isCompact?: boolean
}

export function ClusterFormFields({
  form,
  onFormChange,
  providers,
  instanceTypes,
  templates,
  isCompact = false,
}: ClusterFormFieldsProps) {
  const healthyProviders = useMemo(() => providers.filter((p) => p.status !== "DOWN"), [providers])

  const filteredInstanceTypes = useMemo(
    () =>
      instanceTypes.filter((it) => {
        const providerId = (it as any).providerId || (it as any).provider_id || (it as any).provider?.id
        return !form.providerId || providerId === form.providerId
      }),
    [instanceTypes, form.providerId]
  )

  const regionOptions = useMemo(() => {
    const providerRegions = providers.find((p) => p.id === form.providerId)?.regions || []
    if (providerRegions.length > 0) return providerRegions
    const regionsFromTypes = filteredInstanceTypes.map((t) => t.region).filter(Boolean) as string[]
    return Array.from(new Set(regionsFromTypes))
  }, [providers, form.providerId, filteredInstanceTypes])

  function addInstanceGroup() {
    onFormChange({
      ...form,
      instanceGroups: [
        ...form.instanceGroups,
        { id: crypto.randomUUID(), instanceTypeId: "", role: "", quantity: 1, metadata: "" },
      ],
    })
  }

  function removeInstanceGroup(id: string) {
    onFormChange({
      ...form,
      instanceGroups: form.instanceGroups.filter((g) => g.id !== id),
    })
  }

  function updateInstanceGroup(id: string, updates: Partial<ClusterFormData["instanceGroups"][0]>) {
    onFormChange({
      ...form,
      instanceGroups: form.instanceGroups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })
  }

  const labelSize = isCompact ? "text-xs" : "text-sm"
  const inputHeight = isCompact ? "h-8" : "h-9"
  const textSize = isCompact ? "text-xs" : "text-sm"

  return (
    <div className="flex flex-col gap-4">
      {/* Template Selection */}
      <div className="flex flex-col gap-1.5">
        <Label className={labelSize}>Cluster Template (optional)</Label>
        <Select value={form.templateId} onValueChange={(v) => onFormChange({ ...form, templateId: v })}>
          <SelectTrigger className={`${inputHeight} ${textSize}`}>
            <SelectValue placeholder="No template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className={textSize}>
              No template
            </SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id} className={textSize}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provider and Region */}
      <div className={`grid gap-${isCompact ? "3" : "4"} ${isCompact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        <div className="flex flex-col gap-1.5">
          <Label className={labelSize}>Provider *</Label>
          <Select
            value={form.providerId}
            onValueChange={(v) =>
              onFormChange({
                ...form,
                providerId: v,
                region: "",
                instanceGroups: form.instanceGroups.map((g) => ({ ...g, instanceTypeId: "" })),
              })
            }
          >
            <SelectTrigger className={`${inputHeight} ${textSize}`}>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {healthyProviders.map((p) => (
                <SelectItem key={p.id} value={p.id} className={textSize}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className={labelSize}>Region *</Label>
          {regionOptions.length > 0 ? (
            <Select value={form.region} onValueChange={(v) => onFormChange({ ...form, region: v })}>
              <SelectTrigger className={`${inputHeight} ${textSize}`}>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regionOptions.map((r) => (
                  <SelectItem key={r} value={r} className={textSize}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="e.g. us-east-1"
              className={`${inputHeight} ${textSize}`}
              value={form.region}
              onChange={(e) => onFormChange({ ...form, region: e.target.value })}
            />
          )}
        </div>
      </div>

      {/* Instance Groups */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className={labelSize}>Instance Groups *</Label>
          <Button variant="outline" size="sm" className={`${inputHeight} ${textSize}`} onClick={addInstanceGroup}>
            <Plus className={`mr-${isCompact ? "1" : "2"} h-${isCompact ? "3" : "4"} w-${isCompact ? "3" : "4"}`} />
            Add Group
          </Button>
        </div>

        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
          {form.instanceGroups.map((group, idx) => (
            <div key={group.id} className={`rounded-lg border border-border p-3 ${isCompact ? "shadow-sm bg-muted/20" : "shadow-sm"}`}>
              {!isCompact && (
                <div className="flex items-center justify-between mb-2">
                  <div className={`${textSize} font-semibold text-foreground`}>Group {idx + 1}</div>
                  {form.instanceGroups.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeInstanceGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              <div className={`grid gap-${isCompact ? "2" : "3"} ${isCompact ? "grid-cols-8" : "grid-cols-1 md:grid-cols-3"}`}>
                <div className={`${isCompact ? "col-span-3" : ""} flex flex-col gap-1`}>
                  <Label className={`${isCompact ? "text-[11px]" : "text-xs"} text-muted-foreground`}>
                    Instance Type
                  </Label>
                  <Select
                    value={group.instanceTypeId}
                    onValueChange={(v) => updateInstanceGroup(group.id, { instanceTypeId: v })}
                    disabled={!form.providerId}
                  >
                    <SelectTrigger className={`${inputHeight} ${textSize}`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredInstanceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id} className={textSize}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={`${isCompact ? "col-span-2" : ""} flex flex-col gap-1`}>
                  <Label className={`${isCompact ? "text-[11px]" : "text-xs"} text-muted-foreground`}>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    className={`${inputHeight} ${textSize}`}
                    value={group.quantity}
                    onChange={(e) =>
                      updateInstanceGroup(group.id, {
                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                  />
                </div>

                <div className={`${isCompact ? "col-span-2" : ""} flex flex-col gap-1`}>
                  <Label className={`${isCompact ? "text-[11px]" : "text-xs"} text-muted-foreground`}>
                    Role (optional)
                  </Label>
                  <Input
                    className={`${inputHeight} ${textSize}`}
                    placeholder="worker / trainer"
                    value={group.role}
                    onChange={(e) => updateInstanceGroup(group.id, { role: e.target.value })}
                  />
                </div>

                {isCompact && form.instanceGroups.length > 1 && (
                  <div className="col-span-1 flex justify-end pb-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeInstanceGroup(group.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className={`${isCompact ? "col-span-8" : ""} flex flex-col gap-1 mt-3`}>
                <Label className={`${isCompact ? "text-[11px]" : "text-xs"} text-muted-foreground`}>
                  Metadata (JSON, optional)
                </Label>
                <Textarea
                  className={textSize}
                  rows={3}
                  placeholder='{"team":"ml","env":"staging"}'
                  value={group.metadata}
                  onChange={(e) => updateInstanceGroup(group.id, { metadata: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
