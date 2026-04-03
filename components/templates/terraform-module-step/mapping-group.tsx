"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"

export interface MappingField {
  name: string
  label: string
  sectionLabel?: string
}

interface MappingGroupProps {
  title: string
  subtitle?: string
  fields: MappingField[]
  mapping: Record<string, string>
  onUpdate: (fieldName: string, tfVar: string) => void
}

export function MappingGroup({ title, subtitle, fields, mapping, onUpdate }: MappingGroupProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 text-left hover:bg-muted/50 transition-colors">
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <span className="text-xs font-medium">{title}</span>
        {subtitle && <code className="text-[11px] text-muted-foreground font-mono">{subtitle}</code>}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {Object.values(mapping).filter(Boolean).length}/{fields.length} mapped
        </span>
      </button>
      {open && (
        <div className="p-3 flex flex-col gap-0 divide-y divide-border/50">
          {fields.length === 0 && <p className="text-xs text-muted-foreground italic py-1">No fields in this configuration.</p>}
          {fields.map((field, i) => (
            <div key={`${field.name}-${field.sectionLabel ?? i}`} className="flex items-center gap-3 py-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{field.label}</span>
                  <code className="text-[11px] text-muted-foreground font-mono truncate">{field.name}</code>
                </div>
                {field.sectionLabel && <p className="text-[11px] text-muted-foreground/70">{field.sectionLabel}</p>}
              </div>
              <span className="text-muted-foreground text-xs shrink-0">→</span>
              <Input className="h-7 text-xs font-mono w-48 shrink-0"
                value={typeof mapping[field.name] === "string" ? mapping[field.name] : ""}
                onChange={(e) => onUpdate(field.name, e.target.value)}
                placeholder="tf_var_name" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
