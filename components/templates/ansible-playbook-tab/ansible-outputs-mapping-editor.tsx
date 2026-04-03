"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { OutputResource } from "./types"
import { defaultOutputResource } from "./types"

interface OutputsMappingEditorProps {
  resources: OutputResource[]
  onChange: (v: OutputResource[]) => void
}

export function AnsibleOutputsMappingEditor({ resources, onChange }: OutputsMappingEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      {resources.map((res, ri) => (
        <div key={ri} className="rounded-lg border border-border p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Input
                className="h-7 text-xs font-mono flex-1"
                placeholder="resource name"
                value={res.name}
                onChange={(e) => { const next = [...resources]; next[ri] = { ...next[ri], name: e.target.value }; onChange(next) }}
              />
              <Input
                className="h-7 text-xs font-mono flex-1"
                placeholder="ansible_resource_type"
                value={res.ansible_resource_type}
                onChange={(e) => { const next = [...resources]; next[ri] = { ...next[ri], ansible_resource_type: e.target.value }; onChange(next) }}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(resources.filter((_, j) => j !== ri))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {(["provider_resource_id", "public_ip", "private_ip", "iframe_url"] as const).map((field) => (
              <div key={field} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground font-mono">{field}</span>
                <Input
                  className="h-6 text-xs font-mono"
                  placeholder="output key"
                  value={res.outputs[field]}
                  onChange={(e) => { const next = [...resources]; next[ri] = { ...next[ri], outputs: { ...next[ri].outputs, [field]: e.target.value } }; onChange(next) }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">metadata outputs</span>
            {res.outputs.metadata.map((m, mi) => (
              <div key={mi} className="grid grid-cols-[1fr_1fr_auto] gap-x-2">
                <Input className="h-6 text-xs font-mono" placeholder="meta key" value={m.key}
                  onChange={(e) => { const next = [...resources]; next[ri].outputs.metadata[mi] = { ...m, key: e.target.value }; onChange(next) }} />
                <Input className="h-6 text-xs font-mono" placeholder="output key" value={m.output_key}
                  onChange={(e) => { const next = [...resources]; next[ri].outputs.metadata[mi] = { ...m, output_key: e.target.value }; onChange(next) }} />
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => { const next = [...resources]; next[ri].outputs.metadata = next[ri].outputs.metadata.filter((_, j) => j !== mi); onChange(next) }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 mt-0.5 w-fit"
              onClick={() => { const next = [...resources]; next[ri].outputs.metadata.push({ key: "", output_key: "" }); onChange(next) }}>
              <Plus className="h-3 w-3" />Add metadata field
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 w-fit"
        onClick={() => onChange([...resources, defaultOutputResource()])}>
        <Plus className="h-3.5 w-3.5" />Add resource
      </Button>
    </div>
  )
}
