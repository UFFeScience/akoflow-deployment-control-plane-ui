"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight, Code2, Eye, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OutputsResource {
  name: string
  terraform_type: string
  outputs: {
    provider_resource_id: string
    public_ip: string
    private_ip: string
    iframe_url: string
    metadata: Array<{ key: string; tf_output: string }>
  }
}

export interface OutputsMapping {
  resources: OutputsResource[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function defaultOutputsResource(): OutputsResource {
  return {
    name: "",
    terraform_type: "",
    outputs: {
      provider_resource_id: "",
      public_ip: "",
      private_ip: "",
      iframe_url: "",
      metadata: [],
    },
  }
}

export function parseOutputsMappingJson(raw: string): OutputsMapping | null {
  try {
    const parsed = JSON.parse(raw)
    const resources: OutputsResource[] = (parsed.resources ?? []).map((r: any) => ({
      name: r.name ?? "",
      terraform_type: r.terraform_type ?? "",
      outputs: {
        provider_resource_id: r.outputs?.provider_resource_id ?? "",
        public_ip: r.outputs?.public_ip ?? "",
        private_ip: r.outputs?.private_ip ?? "",
        iframe_url: r.outputs?.iframe_url ?? "",
        metadata: Object.entries((r.outputs?.metadata ?? {}) as Record<string, string>).map(
          ([key, tf_output]) => ({ key, tf_output }),
        ),
      },
    }))
    return { resources }
  } catch {
    return null
  }
}

export function outputsMappingToJson(m: OutputsMapping): string {
  const resources = m.resources.map((r) => ({
    name: r.name,
    terraform_type: r.terraform_type || undefined,
    outputs: {
      ...(r.outputs.provider_resource_id ? { provider_resource_id: r.outputs.provider_resource_id } : {}),
      ...(r.outputs.public_ip ? { public_ip: r.outputs.public_ip } : {}),
      ...(r.outputs.private_ip ? { private_ip: r.outputs.private_ip } : {}),
      ...(r.outputs.iframe_url ? { iframe_url: r.outputs.iframe_url } : {}),
      ...(r.outputs.metadata.length > 0
        ? {
            metadata: Object.fromEntries(
              r.outputs.metadata.filter((m) => m.key).map((m) => [m.key, m.tf_output]),
            ),
          }
        : {}),
    },
  }))
  return JSON.stringify({ resources }, null, 2)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  value: string
  onChange: (raw: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OutputsMappingEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<"visual" | "raw">("visual")

  const parsed = parseOutputsMappingJson(value)

  const updateParsed = (updated: OutputsMapping) => onChange(outputsMappingToJson(updated))

  const patchResource = (index: number, partial: Partial<OutputsResource>) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    resources[index] = { ...resources[index], ...partial }
    updateParsed({ resources })
  }

  const patchOutputs = (index: number, partial: Partial<OutputsResource["outputs"]>) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    resources[index] = { ...resources[index], outputs: { ...resources[index].outputs, ...partial } }
    updateParsed({ resources })
  }

  const addResource = () => {
    const resources = [...(parsed?.resources ?? []), defaultOutputsResource()]
    updateParsed({ resources })
  }

  const removeResource = (index: number) => {
    if (!parsed) return
    updateParsed({ resources: parsed.resources.filter((_, i) => i !== index) })
  }

  const addMetaField = (resourceIndex: number) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    resources[resourceIndex] = {
      ...resources[resourceIndex],
      outputs: {
        ...resources[resourceIndex].outputs,
        metadata: [...resources[resourceIndex].outputs.metadata, { key: "", tf_output: "" }],
      },
    }
    updateParsed({ resources })
  }

  const patchMetaField = (
    resourceIndex: number,
    metaIndex: number,
    partial: Partial<{ key: string; tf_output: string }>,
  ) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    const metadata = [...resources[resourceIndex].outputs.metadata]
    metadata[metaIndex] = { ...metadata[metaIndex], ...partial }
    resources[resourceIndex] = {
      ...resources[resourceIndex],
      outputs: { ...resources[resourceIndex].outputs, metadata },
    }
    updateParsed({ resources })
  }

  const removeMetaField = (resourceIndex: number, metaIndex: number) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    resources[resourceIndex] = {
      ...resources[resourceIndex],
      outputs: {
        ...resources[resourceIndex].outputs,
        metadata: resources[resourceIndex].outputs.metadata.filter((_, i) => i !== metaIndex),
      },
    }
    updateParsed({ resources })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setMode((m) => (m === "visual" ? "raw" : "visual"))}
        >
          {mode === "visual" ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {mode === "visual" ? "Raw JSON" : "Visual editor"}
        </button>
      </div>

      {mode === "raw" ? (
        <div className="flex flex-col gap-1">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-xs leading-relaxed min-h-[200px] resize-y bg-muted/20"
            spellCheck={false}
            placeholder='{ "resources": [] }'
          />
          {parsed === null && value.trim() && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />Invalid JSON
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(parsed?.resources ?? []).map((resource, ri) => (
            <ResourceCard
              key={ri}
              resource={resource}
              index={ri}
              onPatch={(p) => patchResource(ri, p)}
              onPatchOutputs={(p) => patchOutputs(ri, p)}
              onRemove={() => removeResource(ri)}
              onAddMeta={() => addMetaField(ri)}
              onPatchMeta={(mi, p) => patchMetaField(ri, mi, p)}
              onRemoveMeta={(mi) => removeMetaField(ri, mi)}
            />
          ))}

          {(parsed?.resources ?? []).length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No resources mapped yet. Add one to declare what AkoCloud should collect after provisioning.
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 w-fit"
            onClick={addResource}
          >
            <Plus className="h-3.5 w-3.5" />Add Resource
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── ResourceCard ─────────────────────────────────────────────────────────────

const STANDARD_OUTPUTS: Array<{
  key: keyof OutputsResource["outputs"]
  label: string
  placeholder: string
}> = [
  { key: "provider_resource_id", label: "Provider Resource ID", placeholder: "e.g. instance_id" },
  { key: "public_ip",            label: "Public IP",            placeholder: "e.g. public_ip" },
  { key: "private_ip",           label: "Private IP",           placeholder: "e.g. private_ip" },
  { key: "iframe_url",           label: "Preview URL (iframe)", placeholder: "e.g. akoflow_iframe_url" },
]

function ResourceCard({
  resource,
  index,
  onPatch,
  onPatchOutputs,
  onRemove,
  onAddMeta,
  onPatchMeta,
  onRemoveMeta,
}: {
  resource: OutputsResource
  index: number
  onPatch: (p: Partial<OutputsResource>) => void
  onPatchOutputs: (p: Partial<OutputsResource["outputs"]>) => void
  onRemove: () => void
  onAddMeta: () => void
  onPatchMeta: (i: number, p: Partial<{ key: string; tf_output: string }>) => void
  onRemoveMeta: (i: number) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-muted/30 px-3 py-2 gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="text-xs font-medium">
            {resource.name || `Resource ${index + 1}`}
          </span>
          {resource.terraform_type && (
            <code className="text-[11px] text-muted-foreground font-mono">
              {resource.terraform_type}
            </code>
          )}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-4">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Resource Name</Label>
              <Input
                className="h-7 text-xs"
                value={resource.name}
                onChange={(e) => onPatch({ name: e.target.value })}
                placeholder="e.g. nginx-vm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Terraform Type</Label>
              <Input
                className="h-7 text-xs font-mono"
                value={resource.terraform_type}
                onChange={(e) => onPatch({ terraform_type: e.target.value })}
                placeholder="e.g. aws_instance"
              />
            </div>
          </div>

          {/* Standard outputs */}
          <div className="flex flex-col gap-0 divide-y divide-border/50 rounded-md border border-border overflow-hidden">
            <div className="px-3 py-1.5 bg-muted/20">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Standard Outputs → Terraform Output Key
              </p>
            </div>
            {STANDARD_OUTPUTS.map(({ key, label, placeholder }) => (
              <div key={key} className="flex items-center gap-3 px-3 py-1.5">
                <span
                  className={cn(
                    "flex-1 text-xs",
                    key === "iframe_url" && "font-medium text-primary",
                  )}
                >
                  {label}
                  {key === "iframe_url" && (
                    <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                      (opens Preview tab)
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground text-xs shrink-0">→</span>
                <Input
                  className="h-7 text-xs font-mono w-52 shrink-0"
                  value={resource.outputs[key] as string}
                  onChange={(e) => onPatchOutputs({ [key]: e.target.value } as any)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Extra Metadata</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-muted-foreground"
                onClick={onAddMeta}
              >
                <Plus className="h-3 w-3" />Add field
              </Button>
            </div>
            {resource.outputs.metadata.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">
                No extra metadata yet. Use this to capture any additional Terraform outputs.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {resource.outputs.metadata.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-2">
                    <Input
                      className="h-7 text-xs font-mono flex-1"
                      value={m.key}
                      onChange={(e) => onPatchMeta(mi, { key: e.target.value })}
                      placeholder="metadata_key"
                    />
                    <span className="text-muted-foreground text-xs shrink-0">→</span>
                    <Input
                      className="h-7 text-xs font-mono flex-1"
                      value={m.tf_output}
                      onChange={(e) => onPatchMeta(mi, { tf_output: e.target.value })}
                      placeholder="tf_output_name"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveMeta(mi)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
