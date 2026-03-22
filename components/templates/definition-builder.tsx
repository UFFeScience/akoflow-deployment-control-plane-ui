"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { TemplateDefinition, FormField, FormSection } from "@/lib/api/types"

// ─── Internal working types (include id for React keys) ───────────────────────

export interface DraftField extends Omit<FormField, "type"> {
  _id: string
  type: FormField["type"] | string
}

export interface DraftSection {
  _id: string
  name: string
  label: string
  description: string
  fields: DraftField[]
}

export interface DraftDefinition {
  environment_configuration: {
    label: string
    description: string
    sections: DraftSection[]
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2)
}

function emptyField(): DraftField {
  return { _id: uid(), name: "", label: "", type: "string", required: false, default: "", description: "" }
}

function emptySection(): DraftSection {
  return { _id: uid(), name: "", label: "", description: "", fields: [emptyField()] }
}

export function emptyDraftDefinition(): DraftDefinition {
  return {
    environment_configuration: { label: "Environment Configuration", description: "", sections: [emptySection()] },
  }
}

/** Convert draft → clean TemplateDefinition for the API */
export function draftToDefinition(draft: DraftDefinition): TemplateDefinition {
  const cleanField = ({ _id, ...f }: DraftField): FormField => ({
    ...f as any,
    type: f.type as FormField["type"],
    options: f.options?.filter((o) => o.label || o.value),
  })

  const cleanSection = ({ _id, ...s }: DraftSection): FormSection => ({
    ...s,
    fields: s.fields.map(cleanField),
  })

  const expCfg = draft.environment_configuration
  return {
    environment_configuration: {
      label: expCfg.label || "Environment Configuration",
      description: expCfg.description,
      type: "environment",
      sections: expCfg.sections.map(cleanSection),
    },
  }
}

/** Convert existing TemplateDefinition → DraftDefinition */
export function definitionToDraft(def: TemplateDefinition): DraftDefinition {
  const draftField = (f: FormField): DraftField => ({ ...f, _id: uid() })
  const draftSection = (s: FormSection): DraftSection => ({
    ...s, _id: uid(), description: s.description ?? "",
    fields: (s.fields ?? []).map(draftField),
  })

  return {
    environment_configuration: {
      label: def.environment_configuration?.label ?? "Environment Configuration",
      description: def.environment_configuration?.description ?? "",
      sections: (def.environment_configuration?.sections ?? []).map(draftSection),
    },
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

const FIELD_TYPES = [
  { value: "string",      label: "String" },
  { value: "number",      label: "Number" },
  { value: "boolean",     label: "Boolean" },
  { value: "select",      label: "Select" },
  { value: "textarea",    label: "Textarea" },
  { value: "multiselect", label: "Multi-select" },
]

interface Props {
  value: DraftDefinition
  onChange: (draft: DraftDefinition) => void
}

export function DefinitionBuilder({ value, onChange }: Props) {
  // ── Environment configuration mutations ──────────────────────────────────
  const setExpLabel = (label: string) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, label } })

  const setExpDescription = (description: string) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, description } })

  const setExpSections = (sections: DraftSection[]) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, sections } })

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Section Label</Label>
          <Input className="h-8 text-xs" value={value.environment_configuration.label} onChange={(e) => setExpLabel(e.target.value)} placeholder="Environment Configuration" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Description</Label>
          <Input className="h-8 text-xs" value={value.environment_configuration.description} onChange={(e) => setExpDescription(e.target.value)} placeholder="Optional description" />
        </div>
      </div>
      <SectionsEditor
        sections={value.environment_configuration.sections}
        onChange={setExpSections}
      />
    </div>
  )
}

// ─── Sections editor ──────────────────────────────────────────────────────────

function SectionsEditor({ sections, onChange }: { sections: DraftSection[]; onChange: (s: DraftSection[]) => void }) {
  const addSection = () => onChange([...sections, emptySection()])
  const removeSection = (id: string) => onChange(sections.filter((s) => s._id !== id))
  const updateSection = (id: string, patch: Partial<DraftSection>) =>
    onChange(sections.map((s) => s._id === id ? { ...s, ...patch } : s))

  return (
    <div className="flex flex-col gap-2">
      {sections.map((section) => (
        <SectionEditor
          key={section._id}
          section={section}
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

// ─── Section editor ───────────────────────────────────────────────────────────

function SectionEditor({ section, onUpdate, onRemove }: {
  section: DraftSection
  onUpdate: (patch: Partial<DraftSection>) => void
  onRemove: () => void
}) {
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
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Description</Label>
            <Input className="h-7 text-xs" value={section.description} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="Optional section description" />
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-1.5">
            {section.fields.map((field) => (
              <FieldEditor
                key={field._id}
                field={field}
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

// ─── Field editor ─────────────────────────────────────────────────────────────

function FieldEditor({ field, onUpdate, onRemove }: {
  field: DraftField
  onUpdate: (patch: Partial<DraftField>) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const needsOptions = field.type === "select" || field.type === "multiselect"

  return (
    <div className="rounded border border-border/60 bg-background">
      {/* Compact row */}
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
          {expanded ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <code className="text-[11px] font-mono text-muted-foreground truncate w-28 shrink-0">{field.name || "name"}</code>
          <span className="text-xs truncate">{field.label || <span className="text-muted-foreground italic">label</span>}</span>
        </button>

        {/* Type inline */}
        <Select value={field.type as string} onValueChange={(v) => onUpdate({ type: v as any })}>
          <SelectTrigger className="h-6 w-24 text-[11px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-[11px]">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Required toggle */}
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

      {/* Expanded details */}
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

          {(field.type === "number") && (
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
