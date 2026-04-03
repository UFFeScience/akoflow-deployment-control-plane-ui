"use client"

import { useState } from "react"
import { Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { DraftField } from "./types"

const FIELD_TYPES = [
  { value: "string",      label: "String" },
  { value: "number",      label: "Number" },
  { value: "boolean",     label: "Boolean" },
  { value: "select",      label: "Select" },
  { value: "textarea",    label: "Textarea" },
  { value: "multiselect", label: "Multi-select" },
]

interface FieldEditorProps {
  field: DraftField
  availableProviders: string[]
  onUpdate: (patch: Partial<DraftField>) => void
  onRemove: () => void
}

export function FieldEditor({ field, availableProviders, onUpdate, onRemove }: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false)
  const needsOptions = field.type === "select" || field.type === "multiselect"

  return (
    <div className="rounded border border-border/60 bg-background">
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
          {expanded ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <code className="text-[11px] font-mono text-muted-foreground truncate w-28 shrink-0">{field.name || "name"}</code>
          <span className="text-xs truncate">{field.label || <span className="text-muted-foreground italic">label</span>}</span>
        </button>

        <Select value={field.type as string} onValueChange={(v) => onUpdate({ type: v as any })}>
          <SelectTrigger className="h-6 w-24 text-[11px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-[11px]">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <button
          type="button"
          title="Toggle required"
          onClick={() => onUpdate({ required: !field.required })}
          className={cn("text-[10px] rounded px-1 py-0.5 border shrink-0 transition-colors",
            field.required ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-muted text-muted-foreground border-transparent"
          )}
        >
          req
        </button>

        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {expanded && (
        <div className="px-2.5 pb-2.5 grid grid-cols-2 gap-2 border-t border-border/50 pt-2">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Name <span className="text-muted-foreground">(key)</span></Label>
            <Input className="h-7 text-xs font-mono" value={field.name} onChange={(e) => onUpdate({ name: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="field_name" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Label</Label>
            <Input className="h-7 text-xs" value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} placeholder="Field Label" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Default</Label>
            <Input className="h-7 text-xs" value={String(field.default ?? "")} onChange={(e) => {
              const v = e.target.value
              onUpdate({ default: field.type === "number" && v !== "" ? Number(v) : field.type === "boolean" ? v === "true" : v })
            }} placeholder="Default value" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Description</Label>
            <Input className="h-7 text-xs" value={field.description ?? ""} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="Help text" />
          </div>

          {availableProviders.length > 0 && (
            <div className="col-span-2 flex flex-col gap-1">
              <Label className="text-[11px]">Show for providers <span className="text-muted-foreground font-normal">(empty = all)</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {availableProviders.map((slug) => {
                  const isActive = (field.providers ?? []).includes(slug)
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => {
                        const current = field.providers ?? []
                        onUpdate({ providers: isActive ? current.filter((p) => p !== slug) : [...current, slug] })
                      }}
                      className={`text-[11px] rounded border px-2 py-0.5 uppercase font-mono transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-transparent hover:border-border"
                      }`}
                    >
                      {slug}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {field.type === "number" && (
            <>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px]">Min</Label>
                <Input type="number" className="h-7 text-xs" value={field.min ?? ""} onChange={(e) => onUpdate({ min: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px]">Max</Label>
                <Input type="number" className="h-7 text-xs" value={field.max ?? ""} onChange={(e) => onUpdate({ max: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </div>
            </>
          )}

          {needsOptions && (
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Options</Label>
                <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => onUpdate({ options: [...(field.options ?? []), { label: "", value: "" }] })}>
                  + Add option
                </button>
              </div>
              {(field.options ?? []).map((opt, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input className="h-6 text-xs flex-1" placeholder="Label" value={opt.label} onChange={(e) => {
                    const opts = [...(field.options ?? [])]
                    opts[i] = { ...opts[i], label: e.target.value }
                    onUpdate({ options: opts })
                  }} />
                  <Input className="h-6 text-xs flex-1 font-mono" placeholder="value" value={opt.value} onChange={(e) => {
                    const opts = [...(field.options ?? [])]
                    opts[i] = { ...opts[i], value: e.target.value }
                    onUpdate({ options: opts })
                  }} />
                  <button type="button" onClick={() => { const opts = [...(field.options ?? [])]; opts.splice(i, 1); onUpdate({ options: opts }) }} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
