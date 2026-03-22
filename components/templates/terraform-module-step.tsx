"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight, Code2, Eye, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { TerraformProviderType, TemplateDefinition } from "@/lib/api/types"
import { OutputsMappingEditor, parseOutputsMappingJson } from "./outputs-mapping-editor"

// ─── Constants ────────────────────────────────────────────────────────────────

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
  provider_type: TerraformProviderType | string
  main_tf: string
  variables_tf: string
  outputs_tf: string
  credential_env_keys: string[]
  tfvars_mapping_json: string
  outputs_mapping_json: string
}

export function defaultTfDraft(): TfDraft {
  return {
    provider_type: "aws",
    main_tf: "",
    variables_tf: "",
    outputs_tf: "",
    credential_env_keys: [],
    tfvars_mapping_json: JSON.stringify(
      { environment_configuration: {} },
      null,
      2,
    ),
    outputs_mapping_json: JSON.stringify({ resources: [] }, null, 2),
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

  let parsedOutputsMapping: unknown = null
  if (draft.outputs_mapping_json?.trim()) {
    parsedOutputsMapping = parseOutputsMappingJson(draft.outputs_mapping_json) ?? null
  }

  return {
    provider_type: draft.provider_type || undefined,
    credential_env_keys: draft.credential_env_keys.filter(Boolean),
    tfvars_mapping_json: parsedMapping ?? undefined,
    outputs_mapping_json: parsedOutputsMapping ?? undefined,
    main_tf: draft.main_tf || undefined,
    variables_tf: draft.variables_tf || undefined,
    outputs_tf: draft.outputs_tf || undefined,
  }
}

/** Returns true when the draft has enough data to be worth persisting */
export function tfDraftIsConfigured(draft: TfDraft): boolean {
  return !!draft.main_tf.trim()
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

interface MappingState {
  environment_configuration: Record<string, string>
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
      environment_configuration: toStringRecord(parsed.environment_configuration),
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
  value: TfDraft[]
  onChange: (v: TfDraft[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TerraformModuleStep({ definition, value, onChange }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hclTab, setHclTab] = useState<"main" | "variables" | "outputs">("main")
  const [mappingMode, setMappingMode] = useState<"visual" | "raw">("visual")

  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  const current = value[selectedIndex] ?? defaultTfDraft()

  const patchCurrent = (partial: Partial<TfDraft>) => {
    const updated = [...value]
    updated[selectedIndex] = { ...current, ...partial }
    onChange(updated)
  }

  const addProvider = () => {
    onChange([...value, defaultTfDraft()])
    setSelectedIndex(value.length)
    setHclTab("main")
  }

  const removeProvider = (index: number) => {
    if (value.length <= 1) return
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
    setSelectedIndex(Math.max(0, index <= selectedIndex ? selectedIndex - 1 : selectedIndex))
  }

  // ── Auto-populate mapping from definition fields ──────────────────────────
  useEffect(() => {
    if (!definition) return

    const currentValue = valueRef.current
    let anyChanged = false

    const updated = currentValue.map((draft) => {
      const m: MappingState = parseMappingJson(draft.tfvars_mapping_json) ?? {
        environment_configuration: {},
      }
      let changed = false

      const expFieldNames =
        definition.environment_configuration?.sections?.flatMap((s) => s.fields.map((f) => f.name)) ?? []

      for (const name of expFieldNames) {
        if (!m.environment_configuration[name]) {
          m.environment_configuration[name] = name
          changed = true
        }
      }

      if (changed) anyChanged = true
      return changed ? { ...draft, tfvars_mapping_json: mappingToJson(m) } : draft
    })

    if (anyChanged) onChange(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition])

  // Derive definition fields for visual mapping
  const expFields =
    definition?.environment_configuration?.sections?.flatMap((s) =>
      s.fields.map((f) => ({ sectionLabel: s.label, ...f })),
    ) ?? []

  const mappingParsed = parseMappingJson(current.tfvars_mapping_json)

  const updateExpMapping = (fieldName: string, tfVar: string) => {
    const m = parseMappingJson(current.tfvars_mapping_json) ?? {
      environment_configuration: {},
    }
    m.environment_configuration[fieldName] = tfVar
    patchCurrent({ tfvars_mapping_json: mappingToJson(m) })
  }

  const providerLabel = (draft: TfDraft) =>
    PROVIDER_TYPES.find((p) => p.value === draft.provider_type)?.label ?? String(draft.provider_type).toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      {/* PROVIDER TABS ──────────────────────────────────────────────────── */}
      <Section
        title="Provider Configurations"
        description="Providers configured for this template version. Each provider can have its own HCL files."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-0 rounded-lg border border-border overflow-hidden text-xs">
            {value.map((draft, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors border-r border-border last:border-r-0",
                  selectedIndex === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                <button
                  type="button"
                  onClick={() => { setSelectedIndex(i); setHclTab("main") }}
                >
                  {providerLabel(draft)}
                </button>
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeProvider(i) }}
                    className={cn(
                      "rounded-full hover:opacity-80",
                      selectedIndex === i ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={addProvider}
          >
            <Plus className="h-3 w-3" />Add Provider
          </Button>
        </div>
      </Section>

      <Separator />

      {/* PROVIDER TYPE ──────────────────────────────────────────────────── */}
      <Section
        title="Provider Type"
        description="Determines which credentials are injected into the Terraform workspace."
      >
        <div className="w-48">
          <Select value={current.provider_type} onValueChange={(v) => patchCurrent({ provider_type: v as TerraformProviderType })}>
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
        </div>
      </Section>

      <Separator />

      {/* HCL FILES ──────────────────────────────────────────────────────── */}
      <Section
        title="HCL Files"
        description="Provide the Terraform configuration files for this template version."
      >
        <div className="flex gap-0 rounded-t-lg border border-border overflow-hidden text-xs">
          {HCL_TABS.map((t) => {
            const hasContent = !!current[t.key]?.trim()
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
              value={current[t.key]}
              onChange={(e) => patchCurrent({ [t.key]: e.target.value } as Partial<TfDraft>)}
              placeholder={`# ${t.label} content…`}
              className="font-mono text-xs leading-relaxed rounded-t-none border-t-0 min-h-[220px] resize-y bg-muted/20"
              spellCheck={false}
            />
          </div>
        ))}
      </Section>

      <Separator />

      {/* VARIABLES MAPPING ──────────────────────────────────────────────── */}
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
              value={current.tfvars_mapping_json}
              onChange={(e) => patchCurrent({ tfvars_mapping_json: e.target.value })}
              className="font-mono text-xs leading-relaxed min-h-[180px] resize-y bg-muted/20"
              spellCheck={false}
              placeholder='{ "environment_configuration": {} }'
            />
            {parseMappingJson(current.tfvars_mapping_json) === null && current.tfvars_mapping_json.trim() && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />Invalid JSON
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {expFields.length > 0 ? (
              <MappingGroup
                title="Environment Configuration"
                fields={expFields.map((f) => ({ name: f.name, label: f.label, sectionLabel: f.sectionLabel }))}
                mapping={mappingParsed?.environment_configuration ?? {}}
                onUpdate={updateExpMapping}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No environment configuration fields defined yet. Define them in the Definition step, or use Raw JSON mode.
              </p>
            )}

            {expFields.length === 0 && (
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
      {/* OUTPUTS MAPPING ───────────────────────────────────────────────── */}
      <Section
        title="Outputs Mapping"
        description="Declare which Terraform outputs map to AkoCloud provisioned-resource fields (IP, ID, preview URL, etc.)."
      >
        <OutputsMappingEditor
          value={current.outputs_mapping_json}
          onChange={(raw) => patchCurrent({ outputs_mapping_json: raw })}
        />
      </Section>

      <Separator />
      {/* CREDENTIAL ENV KEYS ────────────────────────────────────────────── */}
      <Section
        title="Credential ENV Keys"
        description="Environment variable names injected from the provider credentials into the Terraform workspace."
      >
        <div className="flex flex-col gap-2">
          {current.credential_env_keys.map((key, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="h-8 text-xs font-mono flex-1"
                value={key}
                onChange={(e) => {
                  const keys = [...current.credential_env_keys]
                  keys[i] = e.target.value.toUpperCase().replace(/\s+/g, "_")
                  patchCurrent({ credential_env_keys: keys })
                }}
                placeholder="e.g. AWS_ACCESS_KEY_ID"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  patchCurrent({ credential_env_keys: current.credential_env_keys.filter((_, idx) => idx !== i) })
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
            onClick={() => patchCurrent({ credential_env_keys: [...current.credential_env_keys, ""] })}
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
          {fields.map((field, i) => (
            <div key={`${field.name}-${field.sectionLabel ?? i}`} className="flex items-center gap-3 py-1.5">
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
