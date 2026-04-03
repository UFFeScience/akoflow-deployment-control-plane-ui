"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldEditor } from "./field-editor"
import type { DraftSection, DraftField, DraftGroup } from "./types"
import { emptyField } from "./types"

interface SectionEditorProps {
  section: DraftSection
  groups: DraftGroup[]
  availableProviders: string[]
  onUpdate: (patch: Partial<DraftSection>) => void
  onRemove: () => void
}

export function SectionEditor({ section, groups, availableProviders, onUpdate, onRemove }: SectionEditorProps) {
  const [open, setOpen] = useState(true)

  const addField = () => onUpdate({ fields: [...section.fields, emptyField()] })
  const removeField = (id: string) => onUpdate({ fields: section.fields.filter((f) => f._id !== id) })
  const updateField = (id: string, patch: Partial<DraftField>) =>
    onUpdate({ fields: section.fields.map((f) => f._id === id ? { ...f, ...patch } : f) })

  return (
    <div className="rounded border border-border/70 overflow-hidden">
      <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 flex-1 text-left min-w-0">
          {open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-medium truncate">{section.label || "(unnamed section)"}</span>
          <code className="text-[10px] text-muted-foreground font-mono truncate">{section.name}</code>
          {section.group && (() => {
            const g = groups.find((gr) => gr.name === section.group)
            return <span className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 shrink-0">{g?.label || section.group}</span>
          })()}
        </button>
        <span className="text-[11px] text-muted-foreground shrink-0">{section.fields.length} fields</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">Section Name <span className="text-muted-foreground">(key)</span></Label>
              <Input className="h-7 text-xs font-mono" value={section.name} onChange={(e) => onUpdate({ name: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="e.g. gcp_general" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">Section Label</Label>
              <Input className="h-7 text-xs" value={section.label} onChange={(e) => onUpdate({ label: e.target.value })} placeholder="e.g. Google Cloud Platform" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">Description</Label>
              <Input className="h-7 text-xs" value={section.description} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="Optional section description" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">Group <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={section.group || "__none__"} onValueChange={(v) => onUpdate({ group: v === "__none__" ? "" : v })}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-muted-foreground">No group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g._id} value={g.name || g._id} className="text-xs">
                      {g.label || g.name || "(unnamed group)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {availableProviders.length > 0 && (
            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">Show for providers <span className="text-muted-foreground font-normal">(empty = all)</span></Label>
              <div className="flex flex-wrap gap-1">
                {availableProviders.map((slug) => {
                  const isActive = (section.providers ?? []).includes(slug)
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => {
                        const current = section.providers ?? []
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

          <div className="flex flex-col gap-1.5">
            {section.fields.map((field) => (
              <FieldEditor
                key={field._id}
                field={field}
                availableProviders={availableProviders}
                onUpdate={(patch) => updateField(field._id, patch)}
                onRemove={() => removeField(field._id)}
              />
            ))}
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={addField}>
              <Plus className="h-3 w-3" />Add Field
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SectionsEditor (list of sections) ───────────────────────────────────────

interface SectionsEditorProps {
  sections: DraftSection[]
  groups: DraftGroup[]
  availableProviders: string[]
  onChange: (s: DraftSection[]) => void
}

export function SectionsEditor({ sections, groups, availableProviders, onChange }: SectionsEditorProps) {
  const addSection = () => onChange([...sections, { _id: Math.random().toString(36).slice(2), name: "", label: "", description: "", group: "", providers: [], fields: [{ _id: Math.random().toString(36).slice(2), name: "", label: "", type: "string", required: false, default: "", description: "" }] }])
  const removeSection = (id: string) => onChange(sections.filter((s) => s._id !== id))
  const updateSection = (id: string, patch: Partial<DraftSection>) =>
    onChange(sections.map((s) => s._id === id ? { ...s, ...patch } : s))

  return (
    <div className="flex flex-col gap-2">
      {sections.map((section) => (
        <SectionEditor
          key={section._id}
          section={section}
          groups={groups}
          availableProviders={availableProviders}
          onUpdate={(patch) => updateSection(section._id, patch)}
          onRemove={() => removeSection(section._id)}
        />
      ))}
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addSection}>
        <Plus className="h-3 w-3" />Add Section
      </Button>
    </div>
  )
}
