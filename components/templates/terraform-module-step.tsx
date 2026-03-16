"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight, Code2, Eye, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { TerraformProviderType, TemplateDefinition } from "@/lib/api/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const BUILT_IN_SLUGS = ["aws_nvflare", "gcp_gke"] as const

export const PROVIDER_TYPES: { value: TerraformProviderType; label: string }[] = [
  { value: "aws",    label: "AWS" },
  { value: "gcp",    label: "GCP" },
  { value: "azure",  label: "Azure" },
  { value: "custom", label: "Custom" },
]

const HCL_TABS = [
  { id: "main",      label: "main.tf",      key: "main_tf" as const },
  { id: "variables", label: "variables.tf", key: "variables_tf" as const },
  { id: "outputs",   label: "outputs.tf",   key: "outputs_tf" as const },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TfDraft {
  source: "builtin" | "custom"
  module_slug: string
  provider_type: TerraformProviderType | string
  main_tf: string
  variables_tf: string
  outputs_tf: string
  credential_env_keys: string[]
  tfvars_mapping_json: string
}

export function defaultTfDraft(): TfDraft {
  return {
    source: "builtin",
    module_slug: "",
    provider_type: "aws",
    main_tf: "",
    variables_tf: "",
    outputs_tf: "",
    credential_env_keys: [],
    tfvars_mapping_json: JSON.stringify(
      { experiment_configuration: {}, instance_configurations: {} },
      null,
      2,
    ),
  }
}

/** Convert a TfDraft to the payload accepted by PUT /terraform-module */
export function tfDraftToPayload(draft: TfDraft): Record<string, unknown> {
  let parsedMapping: unknown = null
  if (draft.tfvars_mapping_json.trim()) {
    try {
      parsedMapping = JSON.parse(draft.tfvars_mapping_json)
    } catch {
      parsedMapping = null
    }
  }

  const payload: Record<string, unknown> = {
    provider_type: draft.provider_type || undefined,
    credential_env_keys: draft.credential_env_keys.filter(Boolean),
    tfvars_mapping_json: parsedMapping ?? undefined,
  }

  if (draft.source === "builtin") {
    payload.module_slug = draft.module_slug || undefined
    payload.main_tf = ""
    payload.variables_tf = ""
    payload.outputs_tf = ""
  } else {
    payload.module_slug = undefined
    payload.main_tf = draft.main_tf || undefined
    payload.variables_tf = draft.variables_tf || undefined
    payload.outputs_tf = draft.outputs_tf || undefined
  }

  return payload
}

/** Returns true when the draft has enough data to be worth persisting */
export function tfDraftIsConfigured(draft: TfDraft): boolean {
  const hasBuiltin = draft.source === "builtin" && !!draft.module_slug
  const hasCustom  = draft.source === "custom" && !!draft.main_tf.trim()
  return hasBuiltin || hasCustom
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

interface MappingState {
  experiment_configuration: Record<string, string>
  instance_configurations: Record<string, Record<string, string>>
}

function toStringRecord(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {}
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  )
}

function parseMappingJson(raw: string): MappingState | null {
  try {
    const parsed = JSON.parse(raw)
    return {
      experiment_configuration: toStringRecord(parsed.experiment_configuration),
      instance_configurations: Object.fromEntries(
        Object.entries((parsed.instance_configurations ?? {}) as Record<string, unknown>).map(([k, v]) => [k, toStringRecord(v)]),
      ),
    }
  } catch {
    return null
  }
}

function mappingToJson(m: MappingState): string {
  return JSON.stringify(m, null, 2)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Current TemplateDefinition (from the definition builder step) used to populate mapping fields */
  definition?: TemplateDefinition | null
  value: TfDraft
  onChange: (v: TfDraft) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TerraformModuleStep({ definition, value, onChange }: Props) {
  const [hclTab, setHclTab] = useState<"main" | "variables" | "outputs">("main")
  const [mappingMode, setMappingMode] = useState<"visual" | "raw">("visual")

  const patch = (partial: Partial<TfDraft>) => onChange({ ...value, ...partial })

  // ── Auto-populate mapping from definition fields ──────────────────────────
  // Whenever the definition changes, seed any unmapped field with its own name
  // (field_name → field_name) so the user only needs to edit values that differ.
  useEffect(() => {
    if (!definition) return

    const current: MappingState = parseMappingJson(value.tfvars_mapping_json) ?? {
      experiment_configuration: {},
      instance_configurations: {},
    }

    let changed = false

    // Experiment configuration fields
    const expFieldNames =
      definition.experiment_configuration?.sections?.flatMap((s) => s.fields.map((f) => f.name)) ?? []

    for (const name of expFieldNames) {
      if (!current.experiment_configuration[name]) {
        current.experiment_configuration[name] = name
        changed = true
      }
    }

    // Instance configuration fields
    for (const [instanceKey, cfg] of Object.entries(definition.instance_configurations ?? {})) {
      if (!current.instance_configurations[instanceKey]) {
        current.instance_configurations[instanceKey] = {}
      }
      const instFieldNames =
        (cfg as any).sections?.flatMap((s: any) => s.fields?.map((f: any) => f.name) ?? []) ?? []

      for (const name of instFieldNames) {
        if (!current.instance_configurations[instanceKey][name]) {
          current.instance_configurations[instanceKey][name] = name
          changed = true
        }
      }
    }

    if (changed) {
      onChange({ ...value, tfvars_mapping_json: mappingToJson(current) })
    }
    // We intentionally exclude `value` from deps to avoid an update loop —
    // only re-run when the definition itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition])

  // Derive definition fields for visual mapping
  const expFields =
    definition?.experiment_configuration?.sections?.flatMap((s) =>
      s.fields.map((f) => ({ sectionLabel: s.label, ...f })),
    ) ?? []
  const instanceEntries = Object.entries(definition?.instance_configurations ?? {})

  const mappingParsed = parseMappingJson(value.tfvars_mapping_json)

  const updateExpMapping = (fieldName: string, tfVar: string) => {
    const m = parseMappingJson(value.tfvars_mapping_json) ?? {
      experiment_configuration: {},
      instance_configurations: {},
    }
    m.experiment_configuration[fieldName] = tfVar
    patch({ tfvars_mapping_json: mappingToJson(m) })
  }

  const updateInstMapping = (instanceKey: string, fieldName: string, tfVar: string) => {
    const m = parseMappingJson(value.tfvars_mapping_json) ?? {
      experiment_configuration: {},
      instance_configurations: {},
    }
    if (!m.instance_configurations[instanceKey]) m.instance_configurations[instanceKey] = {}
    m.instance_configurations[instanceKey][fieldName] = tfVar
    patch({ tfvars_mapping_json: mappingToJson(m) })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. MODULE SOURCE ────────────────────────────────────────────────── */}
      <Section
        title="Module Source"
        description="Choose a built-in provisioning module or provide custom Terraform HCL."
      >
        <div className="flex gap-0 rounded-lg border border-border overflow-hidden text-xs w-fit">
          {(["builtin", "custom"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => patch({ source: s })}
              className={cn(
                "px-4 py-1.5 font-medium transition-colors",
                value.source === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted/50",
              )}
            >
              {s === "builtin" ? "Built-in Module" : "Custom HCL"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3">
          {value.source === "builtin" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Module Slug</Label>
              <Select value={value.module_slug} onValueChange={(v) => patch({ module_slug: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a built-in module…" />
                </SelectTrigger>
                <SelectContent>
                  {BUILT_IN_SLUGS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs font-mono">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                The platform will use the built-in Terraform module at{" "}
                <code className="font-mono">infra/terraform/modules/{"{slug}"}</code>.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Provider Type</Label>
            <Select value={value.provider_type} onValueChange={(v) => patch({ provider_type: v as TerraformProviderType })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Determines which credentials are injected into the Terraform workspace.
            </p>
          </div>
        </div>
      </Section>

      <Separator />

      {/* 2. HCL FILES ────────────────────────────────────────────────────── */}
      <Section
        title="HCL Files"
        description={
          value.source === "builtin"
            ? "Optional — these files override the built-in module defaults."
            : "Provide the Terraform configuration files for this template version."
        }
      >
        <div className="flex gap-0 rounded-t-lg border border-border overflow-hidden text-xs">
          {HCL_TABS.map((t) => {
            const hasContent = !!value[t.key]?.trim()
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setHclTab(t.id as "main" | "variables" | "outputs")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors font-mono",
                  hclTab === t.id
                    ? "bg-muted/70 text-foreground border-b-2 border-primary"
                    : "bg-background text-muted-foreground hover:bg-muted/30",
                )}
              >
                {t.label}
                {hasContent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="Has content" />
                )}
              </button>
            )
          })}
        </div>

        {HCL_TABS.map((t) => (
          <div key={t.id} className={hclTab === t.id ? "block" : "hidden"}>
            <Textarea
              value={value[t.key]}
              onChange={(e) => patch({ [t.key]: e.target.value } as Partial<TfDraft>)}
              placeholder={`# ${t.label} content…`}
              className="font-mono text-xs leading-relaxed rounded-t-none border-t-0 min-h-[220px] resize-y bg-muted/20"
              spellCheck={false}
            />
          </div>
        ))}
      </Section>

      <Separator />

      {/* 3. VARIABLES MAPPING ────────────────────────────────────────────── */}
      <Section
        title="Variables Mapping"
        description="Map definition form fields to Terraform variable names."
        action={
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMappingMode((m) => (m === "visual" ? "raw" : "visual"))}
          >
            {mappingMode === "visual" ? (
              <Code2 className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {mappingMode === "visual" ? "Raw JSON" : "Visual editor"}
          </button>
        }
      >
        {mappingMode === "raw" ? (
          <div className="flex flex-col gap-1">
            <Textarea
              value={value.tfvars_mapping_json}
              onChange={(e) => patch({ tfvars_mapping_json: e.target.value })}
              className="font-mono text-xs leading-relaxed min-h-[180px] resize-y bg-muted/20"
              spellCheck={false}
              placeholder='{ "experiment_configuration": {}, "instance_configurations": {} }'
            />
            {parseMappingJson(value.tfvars_mapping_json) === null && value.tfvars_mapping_json.trim() && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />Invalid JSON
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {expFields.length > 0 ? (
              <MappingGroup
                title="Experiment Configuration"
                fields={expFields.map((f) => ({ name: f.name, label: f.label, sectionLabel: f.sectionLabel }))}
                mapping={mappingParsed?.experiment_configuration ?? {}}
                onUpdate={updateExpMapping}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No experiment configuration fields defined yet. Define them in the Definition step, or use Raw JSON mode.
              </p>
            )}

            {instanceEntries.map(([key, cfg]) => {
              const instFields =
                (cfg as any).sections?.flatMap((s: any) =>
                  s.fields?.map((f: any) => ({ name: f.name, label: f.label, sectionLabel: s.label })) ?? [],
                ) ?? []
              return (
                <MappingGroup
                  key={key}
                  title={`Instance: ${(cfg as any).label ?? key}`}
                  subtitle={key}
                  fields={instFields}
                  mapping={mappingParsed?.instance_configurations?.[key] ?? {}}
                  onUpdate={(fieldName, tfVar) => updateInstMapping(key, fieldName, tfVar)}
                />
              )
            })}

            {expFields.length === 0 && instanceEntries.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No fields available from the definition. Add fields in the Definition step or switch to Raw JSON mode.
                </p>
              </div>
            )}
          </div>
        )}
      </Section>

      <Separator />

      {/* 4. CREDENTIAL ENV KEYS ─────────────────────────────────────────── */}
      <Section
        title="Credential ENV Keys"
        description="Environment variable names injected from the provider credentials into the Terraform workspace."
      >
        <div className="flex flex-col gap-2">
          {value.credential_env_keys.map((key, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="h-8 text-xs font-mono flex-1"
                value={key}
                onChange={(e) => {
                  const keys = [...value.credential_env_keys]
                  keys[i] = e.target.value.toUpperCase().replace(/\s+/g, "_")
                  patch({ credential_env_keys: keys })
                }}
                placeholder="e.g. AWS_ACCESS_KEY_ID"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  patch({ credential_env_keys: value.credential_env_keys.filter((_, idx) => idx !== i) })
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 w-fit"
            onClick={() => patch({ credential_env_keys: [...value.credential_env_keys, ""] })}
          >
            <Plus className="h-3.5 w-3.5" />Add env key
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Common examples:{" "}
            <code className="font-mono">AWS_ACCESS_KEY_ID</code>,{" "}
            <code className="font-mono">GOOGLE_APPLICATION_CREDENTIALS</code>
          </p>
        </div>
      </Section>
    </div>
  )
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Mapping group ─────────────────────────────────────────────────────────────

interface MappingField {
  name: string
  label: string
  sectionLabel?: string
}

function MappingGroup({
  title,
  subtitle,
  fields,
  mapping,
  onUpdate,
}: {
  title: string
  subtitle?: string
  fields: MappingField[]
  mapping: Record<string, string>
  onUpdate: (fieldName: string, tfVar: string) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 text-left hover:bg-muted/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-xs font-medium">{title}</span>
        {subtitle && (
          <code className="text-[11px] text-muted-foreground font-mono">{subtitle}</code>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {Object.values(mapping).filter(Boolean).length}/{fields.length} mapped
        </span>
      </button>

      {open && (
        <div className="p-3 flex flex-col gap-0 divide-y divide-border/50">
          {fields.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-1">No fields in this configuration.</p>
          )}
          {fields.map((field) => (
            <div key={field.name} className="flex items-center gap-3 py-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{field.label}</span>
                  <code className="text-[11px] text-muted-foreground font-mono truncate">{field.name}</code>
                </div>
                {field.sectionLabel && (
                  <p className="text-[11px] text-muted-foreground/70">{field.sectionLabel}</p>
                )}
              </div>
              <span className="text-muted-foreground text-xs shrink-0">→</span>
              <Input
                className="h-7 text-xs font-mono w-48 shrink-0"
                value={typeof mapping[field.name] === "string" ? mapping[field.name] : ""}
                onChange={(e) => onUpdate(field.name, e.target.value)}
                placeholder="tf_var_name"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
