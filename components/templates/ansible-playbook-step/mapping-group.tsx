"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

export interface MappingField {
  name: string
  label: string
  sectionLabel?: string
}

interface MappingGroupProps {
  title: string
  fields: MappingField[]
  mapping: Record<string, string>
  onUpdate: (fieldName: string, value: string) => void
}

export function MappingGroup({ title, fields, mapping, onUpdate }: MappingGroupProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 text-left hover:bg-muted/50 transition-colors">
        {open
          ? <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          : <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>}
        <span className="text-xs font-medium">{title}</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {Object.values(mapping).filter(Boolean).length}/{fields.length} mapped
        </span>
      </button>
      {open && (
        <div className="p-3 flex flex-col gap-0 divide-y divide-border/50">
          {fields.length === 0 && <p className="text-xs text-muted-foreground italic py-1">No fields in this configuration.</p>}
          {fields.map((field, i) => (
            <div key={`${field.name}-${i}`} className="flex items-center gap-3 py-1.5">
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
                placeholder="ansible_var" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
