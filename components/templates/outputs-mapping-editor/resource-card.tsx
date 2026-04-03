import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { OutputsResource } from "./types"

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

interface Props {
  resource: OutputsResource
  index: number
  onPatch: (p: Partial<OutputsResource>) => void
  onPatchOutputs: (p: Partial<OutputsResource["outputs"]>) => void
  onRemove: () => void
  onAddMeta: () => void
  onPatchMeta: (i: number, p: Partial<{ key: string; tf_output: string }>) => void
  onRemoveMeta: (i: number) => void
}

export function ResourceCard({ resource, index, onPatch, onPatchOutputs, onRemove, onAddMeta, onPatchMeta, onRemoveMeta }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center bg-muted/30 px-3 py-2 gap-2">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 flex-1 text-left">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-medium">{resource.name || `Resource ${index + 1}`}</span>
          {resource.terraform_type && <code className="text-[11px] text-muted-foreground font-mono">{resource.terraform_type}</code>}
        </button>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Resource Name</Label>
              <Input className="h-7 text-xs" value={resource.name} onChange={(e) => onPatch({ name: e.target.value })} placeholder="e.g. nginx-vm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Terraform Type</Label>
              <Input className="h-7 text-xs font-mono" value={resource.terraform_type} onChange={(e) => onPatch({ terraform_type: e.target.value })} placeholder="e.g. aws_instance" />
            </div>
          </div>

          <div className="flex flex-col gap-0 divide-y divide-border/50 rounded-md border border-border overflow-hidden">
            <div className="px-3 py-1.5 bg-muted/20">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Standard Outputs → Terraform Output Key</p>
            </div>
            {STANDARD_OUTPUTS.map(({ key, label, placeholder }) => (
              <div key={key} className="flex items-center gap-3 px-3 py-1.5">
                <span className={cn("flex-1 text-xs", key === "iframe_url" && "font-medium text-primary")}>
                  {label}
                  {key === "iframe_url" && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(opens Preview tab)</span>}
                </span>
                <span className="text-muted-foreground text-xs shrink-0">→</span>
                <Input className="h-7 text-xs font-mono w-52 shrink-0" value={resource.outputs[key] as string}
                  onChange={(e) => onPatchOutputs({ [key]: e.target.value } as any)} placeholder={placeholder} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Extra Metadata</p>
              <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground" onClick={onAddMeta}>
                <Plus className="h-3 w-3" />Add field
              </Button>
            </div>
            {resource.outputs.metadata.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No extra metadata yet. Use this to capture any additional Terraform outputs.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {resource.outputs.metadata.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-2">
                    <Input className="h-7 text-xs font-mono flex-1" value={m.key} onChange={(e) => onPatchMeta(mi, { key: e.target.value })} placeholder="metadata_key" />
                    <span className="text-muted-foreground text-xs shrink-0">→</span>
                    <Input className="h-7 text-xs font-mono flex-1" value={m.tf_output} onChange={(e) => onPatchMeta(mi, { tf_output: e.target.value })} placeholder="tf_output_name" />
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onRemoveMeta(mi)}>
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
