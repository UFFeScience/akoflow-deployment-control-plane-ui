"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TemplateDefinition, FormField, FormSection, TemplateConfigGroup } from "@/lib/api/types"

// ─── Internal working types (include id for React keys) ───────────────────────

export interface DraftField extends Omit<FormField, "type"> {
  _id: string
  type: FormField["type"] | string
}

export interface DraftGroup {
  _id: string
  name: string
  label: string
  description: string
  icon: string
}

export interface DraftSection {
  _id: string
  name: string
  label: string
  description: string
  group: string
  /** Provider slugs this section is scoped to (empty = all providers). */
  providers?: string[]
  fields: DraftField[]
}

export interface DraftDefinition {
  /** All provider slugs this template supports (e.g. ["aws", "gcp"]) */
  providers: string[]
  /** Subset that are mandatory for every deployment */
  required_providers: string[]
  /** Minimum number of providers the user must select */
  min_providers: number
  environment_configuration: {
    label: string
    description: string
    groups: DraftGroup[]
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

function emptyGroup(): DraftGroup {
  return { _id: uid(), name: "", label: "", description: "", icon: "" }
}

function emptySection(): DraftSection {
  return { _id: uid(), name: "", label: "", description: "", group: "", providers: [], fields: [emptyField()] }
}

export function emptyDraftDefinition(): DraftDefinition {
  return {
    providers: [],
    required_providers: [],
    min_providers: 1,
    environment_configuration: { label: "Environment Configuration", description: "", groups: [], sections: [emptySection()] },
  }
}

/** Convert draft → clean TemplateDefinition for the API */
export function draftToDefinition(draft: DraftDefinition): TemplateDefinition {
  const cleanField = ({ _id, ...f }: DraftField): FormField => ({
    ...f as any,
    type: f.type as FormField["type"],
    options: f.options?.filter((o) => o.label || o.value),
    providers: f.providers && f.providers.length > 0 ? f.providers : undefined,
  })

  const cleanSection = ({ _id, ...s }: DraftSection): FormSection => ({
    ...s,
    group: s.group || undefined,
    providers: s.providers && s.providers.length > 0 ? s.providers : undefined,
    fields: s.fields.map(cleanField),
  })

  const cleanGroup = ({ _id, ...g }: DraftGroup) => ({
    name: g.name,
    label: g.label,
    description: g.description || undefined,
    icon: g.icon || undefined,
  })

  const expCfg = draft.environment_configuration
  const groups = expCfg.groups.filter((g) => g.name).map(cleanGroup)
  return {
    providers: draft.providers.length > 0 ? draft.providers : undefined,
    required_providers: draft.required_providers.length > 0 ? draft.required_providers : undefined,
    min_providers: draft.min_providers > 1 ? draft.min_providers : undefined,
    environment_configuration: {
      label: expCfg.label || "Environment Configuration",
      description: expCfg.description,
      type: "environment",
      groups: groups.length ? groups : undefined,
      sections: expCfg.sections.map(cleanSection),
    },
  }
}

/** Convert existing TemplateDefinition → DraftDefinition */
export function definitionToDraft(def: TemplateDefinition): DraftDefinition {
  const draftField = (f: FormField): DraftField => ({ ...f, _id: uid() })
  const draftSection = (s: FormSection): DraftSection => ({
    ...s, _id: uid(), description: s.description ?? "", group: s.group ?? "",
    providers: s.providers ? [...s.providers] : [],
    fields: (s.fields ?? []).map(draftField),
  })
  const draftGroup = (g: TemplateConfigGroup): DraftGroup => ({
    _id: uid(), name: g.name, label: g.label, description: g.description ?? "", icon: g.icon ?? "",
  })

  return {
    providers: (def.providers ?? []).slice(),
    required_providers: (def.required_providers ?? []).slice(),
    min_providers: def.min_providers ?? 1,
    environment_configuration: {
      label: def.environment_configuration?.label ?? "Environment Configuration",
      description: def.environment_configuration?.description ?? "",
      groups: (def.environment_configuration?.groups ?? []).map(draftGroup),
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
  // ── Providers mutations ───────────────────────────────────────────────────
  const setProviders = (providers: string[], required_providers: string[]) =>
    onChange({ ...value, providers, required_providers })
  const setMinProviders = (min_providers: number) => onChange({ ...value, min_providers })

  // ── Environment configuration mutations ──────────────────────────────────
  const setExpLabel = (label: string) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, label } })

  const setExpDescription = (description: string) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, description } })

  const setExpGroups = (groups: DraftGroup[]) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, groups } })

  const setExpSections = (sections: DraftSection[]) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, sections } })

  return (
    <div className="flex flex-col gap-4">
      <ProvidersEditor
        providers={value.providers}
        requiredProviders={value.required_providers}
        minProviders={value.min_providers}
        onChangeProviders={setProviders}
        onChangeMin={setMinProviders}
      />
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
      <GroupsEditor
        groups={value.environment_configuration.groups}
        onChange={setExpGroups}
      />
      <SectionsEditor
        sections={value.environment_configuration.sections}
        groups={value.environment_configuration.groups}
        availableProviders={value.providers}
        onChange={setExpSections}
      />
    </div>
  )
}

// ─── Providers editor ─────────────────────────────────────────────────────────

const KNOWN_PROVIDERS = [
  { slug: "aws",     label: "Amazon Web Services (AWS)" },
  { slug: "gcp",     label: "Google Cloud Platform (GCP)" },
  { slug: "azure",   label: "Microsoft Azure" },
  { slug: "on_prem", label: "On-Premises" },
  { slug: "hpc",     label: "HPC" },
]

function ProvidersEditor({
  providers,
  requiredProviders,
  minProviders,
  onChangeProviders,
  onChangeMin,
}: {
  providers: string[]
  requiredProviders: string[]
  minProviders: number
  onChangeProviders: (providers: string[], requiredProviders: string[]) => void
  onChangeMin: (min: number) => void
}) {
  const [open, setOpen] = useState(false)

  const addProvider = (slug: string) => {
    if (!providers.includes(slug)) onChangeProviders([...providers, slug], requiredProviders)
  }
  const removeProvider = (slug: string) =>
    onChangeProviders(
      providers.filter((p) => p !== slug),
      requiredProviders.filter((p) => p !== slug),
    )
  const toggleRequired = (slug: string) => {
    const isReq = requiredProviders.includes(slug)
    onChangeProviders(providers, isReq ? requiredProviders.filter((p) => p !== slug) : [...requiredProviders, slug])
  }

  const available = KNOWN_PROVIDERS.filter((p) => !providers.includes(p.slug))

  return (
    <div className="rounded border border-border/70 overflow-hidden">
      <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 flex-1 text-left">
          {open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-semibold">Providers</span>
          <span className="text-[11px] text-muted-foreground">
            {providers.length === 0 ? "(none — single-provider deployment)" : `(${providers.map((s) => s.toUpperCase()).join(", ")})`}
          </span>
        </button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Define which cloud providers this template supports. Mark providers as <strong>required</strong> to force them on every deployment; optional providers can be toggled on/off per environment.
          </p>

          {providers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {providers.map((slug) => {
                const isReq = requiredProviders.includes(slug)
                return (
                  <div key={slug} className="flex items-center justify-between rounded border border-border/60 bg-background px-2.5 py-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs uppercase">{slug}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRequired(slug)}
                        className={`text-[11px] rounded border px-2 py-0.5 transition-colors font-medium ${
                          isReq
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            : "bg-muted text-muted-foreground border-transparent hover:border-border"
                        }`}
                      >
                        {isReq ? "required" : "optional"}
                      </button>
                      <button type="button" onClick={() => removeProvider(slug)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {available.length > 0 && (
            <div className="flex items-center gap-2">
              <Select onValueChange={addProvider} value="">
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Add provider…" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((p) => (
                    <SelectItem key={p.slug} value={p.slug} className="text-xs">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {providers.length === 0 && (
            <p className="text-[11px] text-amber-600 italic">
              No providers selected — deployments will use a single provider/credential selector.
            </p>
          )}

          {providers.length > 0 && (
            <div className="flex items-center gap-3">
              <Label className="text-[11px] shrink-0">Min providers required</Label>
              <input
                type="number"
                min={1}
                max={providers.length}
                value={minProviders}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (!isNaN(v) && v >= 1 && v <= providers.length) onChangeMin(v)
                }}
                className="h-7 w-16 rounded border border-border bg-background px-2 text-xs text-center"
              />
              <span className="text-[11px] text-muted-foreground">of {providers.length} available</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Groups editor ───────────────────────────────────────────────────────────

function GroupsEditor({ groups, onChange }: { groups: DraftGroup[]; onChange: (g: DraftGroup[]) => void }) {
  const [open, setOpen] = useState(false)

  const addGroup = () => onChange([...groups, emptyGroup()])
  const removeGroup = (id: string) => onChange(groups.filter((g) => g._id !== id))
  const updateGroup = (id: string, patch: Partial<DraftGroup>) =>
    onChange(groups.map((g) => g._id === id ? { ...g, ...patch } : g))

  return (
    <div className="rounded border border-border/70 overflow-hidden">
      <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 flex-1 text-left">
          {open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-semibold">Groups</span>
          <span className="text-[11px] text-muted-foreground">({groups.length} defined)</span>
        </button>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] gap-1 text-muted-foreground" onClick={addGroup}>
          <Plus className="h-3 w-3" />Add Group
        </Button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-2">
          {groups.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic">No groups defined. Groups let you organise sections into tabs or collapsible panels.</p>
          )}
          {groups.map((group) => (
            <div key={group._id} className="rounded border border-border/60 bg-background p-2.5 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">Name <span className="text-muted-foreground">(key)</span></Label>
                  <Input className="h-7 text-xs font-mono" value={group.name} onChange={(e) => updateGroup(group._id, { name: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="e.g. network" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">Label</Label>
                  <Input className="h-7 text-xs" value={group.label} onChange={(e) => updateGroup(group._id, { label: e.target.value })} placeholder="e.g. Network Configuration" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">Description</Label>
                  <Input className="h-7 text-xs" value={group.description} onChange={(e) => updateGroup(group._id, { description: e.target.value })} placeholder="Optional description" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">Icon <span className="text-muted-foreground">(optional)</span></Label>
                  <div className="flex gap-1.5">
                    <Input className="h-7 text-xs flex-1" value={group.icon} onChange={(e) => updateGroup(group._id, { icon: e.target.value })} placeholder="e.g. network" />
                    <button type="button" onClick={() => removeGroup(group._id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 px-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sections editor ──────────────────────────────────────────────────────────

function SectionsEditor({ sections, groups, availableProviders, onChange }: { sections: DraftSection[]; groups: DraftGroup[]; availableProviders: string[]; onChange: (s: DraftSection[]) => void }) {
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

// ─── Section editor ───────────────────────────────────────────────────────────

function SectionEditor({ section, groups, availableProviders, onUpdate, onRemove }: {
  section: DraftSection
  groups: DraftGroup[]
  availableProviders: string[]
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

          {/* Fields */}
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

// ─── Field editor ─────────────────────────────────────────────────────────────

function FieldEditor({ field, availableProviders, onUpdate, onRemove }: {
  field: DraftField
  availableProviders: string[]
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
