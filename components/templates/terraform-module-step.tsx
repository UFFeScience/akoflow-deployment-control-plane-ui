"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, Code2, Eye, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { TerraformProviderType, TemplateDefinition } from "@/lib/api/types"
import { OutputsMappingEditor } from "./outputs-mapping-editor"
import {
  PROVIDER_TYPES, HCL_TABS,
  defaultTfDraft, parseMappingJson, mappingToJson,
  type TfDraft, type MappingState,
} from "./terraform-module-step/types"
import { Section } from "./terraform-module-step/section"
import { MappingGroup } from "./terraform-module-step/mapping-group"

export type { TfDraft } from "./terraform-module-step/types"
export { defaultTfDraft, tfDraftToPayload, tfDraftIsConfigured, PROVIDER_TYPES } from "./terraform-module-step/types"

// Providers that don't require cloud provisioning via Terraform
const NON_CLOUD_PROVIDERS = new Set(["hpc", "on_prem"])

function getCloudProviders(definition?: TemplateDefinition | null): string[] {
  return (definition?.providers ?? []).filter((p) => !NON_CLOUD_PROVIDERS.has(p))
}

function providerLabel(slug: string): string {
  return PROVIDER_TYPES.find((p) => p.value === slug)?.label ?? slug.toUpperCase()
}

interface Props {
  definition?: TemplateDefinition | null
  value: TfDraft[]
  onChange: (v: TfDraft[]) => void
}

export function TerraformModuleStep({ definition, value, onChange }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hclTab, setHclTab] = useState<"main" | "variables" | "outputs">("main")
  const [mappingMode, setMappingMode] = useState<"visual" | "raw">("visual")

  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  // ── Sync provider tabs with definition.providers ──────────────────────────
  const providersKey = (definition?.providers ?? []).join(",")
  useEffect(() => {
    const cloudProviders = getCloudProviders(definition)
    if (cloudProviders.length === 0) return
    const current = valueRef.current
    const existingSlugs = current.map((d) => d.provider_type)
    const toAdd = cloudProviders.filter((p) => !existingSlugs.includes(p as TerraformProviderType))
    if (toAdd.length > 0) {
      onChange([
        ...current,
        ...toAdd.map((p) => ({ ...defaultTfDraft(), provider_type: p as TerraformProviderType })),
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersKey])

  // ── Sync mapping fields when definition fields change ─────────────────────
  useEffect(() => {
    if (!definition) return
    const currentValue = valueRef.current
    let anyChanged = false
    const updated = currentValue.map((draft) => {
      const m: MappingState = parseMappingJson(draft.tfvars_mapping_json) ?? { environment_configuration: {} }
      let changed = false
      const fieldNames = definition.environment_configuration?.sections?.flatMap((s) => s.fields.map((f) => f.name)) ?? []
      for (const name of fieldNames) {
        if (!m.environment_configuration[name]) { m.environment_configuration[name] = name; changed = true }
      }
      if (changed) anyChanged = true
      return changed ? { ...draft, tfvars_mapping_json: mappingToJson(m) } : draft
    })
    if (anyChanged) onChange(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition])

  const current = value[selectedIndex] ?? defaultTfDraft()

  const patchCurrent = (partial: Partial<TfDraft>) => {
    const updated = [...value]
    updated[selectedIndex] = { ...current, ...partial }
    onChange(updated)
  }

  const removeProvider = (index: number) => {
    if (value.length <= 1) return
    onChange(value.filter((_, i) => i !== index))
    setSelectedIndex(Math.max(0, index <= selectedIndex ? selectedIndex - 1 : selectedIndex))
  }

  const addCustom = () => {
    const newDraft = { ...defaultTfDraft(), provider_type: "custom" as TerraformProviderType }
    onChange([...value, newDraft])
    setSelectedIndex(value.length)
    setHclTab("main")
  }

  const cloudProviders = getCloudProviders(definition)
  const expFields = definition?.environment_configuration?.sections?.flatMap((s) =>
    s.fields.map((f) => ({ sectionLabel: s.label, ...f }))
  ) ?? []

  const mappingParsed = parseMappingJson(current.tfvars_mapping_json)
  const updateExpMapping = (fieldName: string, tfVar: string) => {
    const m = parseMappingJson(current.tfvars_mapping_json) ?? { environment_configuration: {} }
    m.environment_configuration[fieldName] = tfVar
    patchCurrent({ tfvars_mapping_json: mappingToJson(m) })
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (value.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-6 py-10 text-center flex flex-col gap-2 items-center">
        <p className="text-sm text-muted-foreground">
          No cloud providers defined in this template.
        </p>
        <p className="text-xs text-muted-foreground">
          Go back to the Definition step and add AWS, GCP, or Azure — or skip this step for HPC / On-Premises templates.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Provider tab bar */}
      <Section
        title="Terraform per Provider"
        description="Select a provider tab to configure its HCL files and variable mapping."
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
                  {providerLabel(draft.provider_type)}
                </button>
                {value.length > 1 && !cloudProviders.includes(draft.provider_type) && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeProvider(i) }}
                    className={cn("rounded-full hover:opacity-80", selectedIndex === i ? "text-primary-foreground/70" : "text-muted-foreground")}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addCustom}>
            <Plus className="h-3 w-3" />Custom
          </Button>
        </div>
        {cloudProviders.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Tabs auto-populated from: {cloudProviders.map(providerLabel).join(", ")}.
            Each tab has independent HCL files.
          </p>
        )}
      </Section>

      <Separator />

      <Section title="HCL Files" description={`Terraform configuration for ${providerLabel(current.provider_type)}.`}>
        <div className="flex gap-0 rounded-t-lg border border-border overflow-hidden text-xs">
          {HCL_TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setHclTab(t.id as "main" | "variables" | "outputs")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors font-mono",
                hclTab === t.id ? "bg-muted/70 text-foreground border-b-2 border-primary" : "bg-background text-muted-foreground hover:bg-muted/30",
              )}
            >
              {t.label}
              {!!current[t.key]?.trim() && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
            </button>
          ))}
        </div>
        {HCL_TABS.map((t) => (
          <div key={t.id} className={hclTab === t.id ? "block" : "hidden"}>
            <Textarea value={current[t.key]} onChange={(e) => patchCurrent({ [t.key]: e.target.value } as Partial<TfDraft>)}
              placeholder={`# ${t.label} content…`}
              className="font-mono text-xs leading-relaxed rounded-t-none border-t-0 min-h-[220px] resize-y bg-muted/20" spellCheck={false} />
          </div>
        ))}
      </Section>

      <Separator />

      <Section title="Variables Mapping" description="Map definition form fields to Terraform variable names."
        action={
          <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMappingMode((m) => (m === "visual" ? "raw" : "visual"))}>
            {mappingMode === "visual" ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {mappingMode === "visual" ? "Raw JSON" : "Visual editor"}
          </button>
        }
      >
        {mappingMode === "raw" ? (
          <div className="flex flex-col gap-1">
            <Textarea value={current.tfvars_mapping_json} onChange={(e) => patchCurrent({ tfvars_mapping_json: e.target.value })}
              className="font-mono text-xs leading-relaxed min-h-[180px] resize-y bg-muted/20" spellCheck={false}
              placeholder='{ "environment_configuration": {} }' />
            {parseMappingJson(current.tfvars_mapping_json) === null && current.tfvars_mapping_json.trim() && (
              <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Invalid JSON</p>
            )}
          </div>
        ) : expFields.length > 0 ? (
          <MappingGroup title="Environment Configuration"
            fields={expFields.map((f) => ({ name: f.name, label: f.label, sectionLabel: f.sectionLabel }))}
            mapping={mappingParsed?.environment_configuration ?? {}}
            onUpdate={updateExpMapping} />
        ) : (
          <p className="text-xs text-muted-foreground italic">No fields defined yet. Add them in the Definition step or use Raw JSON mode.</p>
        )}
      </Section>

      <Separator />

      <Section title="Outputs Mapping" description="Map Terraform outputs to AkoCloud provisioned-resource fields.">
        <OutputsMappingEditor value={current.outputs_mapping_json} onChange={(raw) => patchCurrent({ outputs_mapping_json: raw })} />
      </Section>

      <Separator />

      <Section title="Credential ENV Keys" description="Environment variables injected from provider credentials.">
        <div className="flex flex-col gap-2">
          {current.credential_env_keys.map((key, i) => (
            <div key={i} className="flex gap-2">
              <Input className="h-8 text-xs font-mono flex-1" value={key} placeholder="e.g. AWS_ACCESS_KEY_ID"
                onChange={(e) => { const keys = [...current.credential_env_keys]; keys[i] = e.target.value.toUpperCase().replace(/\s+/g, "_"); patchCurrent({ credential_env_keys: keys }) }} />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => patchCurrent({ credential_env_keys: current.credential_env_keys.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-fit"
            onClick={() => patchCurrent({ credential_env_keys: [...current.credential_env_keys, ""] })}>
            <Plus className="h-3.5 w-3.5" />Add env key
          </Button>
        </div>
      </Section>
    </div>
  )
}
