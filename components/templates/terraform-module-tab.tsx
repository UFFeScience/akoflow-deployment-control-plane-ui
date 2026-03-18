"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, Save, Plus, Trash2, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Code2, Eye, EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import type { TemplateVersion, TerraformModule, TerraformProviderType, Provider } from "@/lib/api/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const HCL_TABS = [
  { id: "main",      label: "main.tf",      key: "main_tf" as const },
  { id: "variables", label: "variables.tf", key: "variables_tf" as const },
  { id: "outputs",   label: "outputs.tf",   key: "outputs_tf" as const },
]

// ─── Form state ───────────────────────────────────────────────────────────────

interface TfForm {
  module_slug: string
  provider_type: string
  main_tf: string
  variables_tf: string
  outputs_tf: string
  credential_env_keys: string[]
  // mapping stored as raw JSON string (editable) plus parsed state
  tfvars_mapping_json: string
  mapping_mode: "visual" | "raw"
}

function defaultForm(mod?: TerraformModule | null): TfForm {
  const credKeys = Array.isArray(mod?.credential_env_keys)
    ? mod?.credential_env_keys
    : mod?.credential_env_keys
      ? [String(mod.credential_env_keys)]
      : []

  return {
    module_slug: mod?.module_slug ?? "",
    provider_type: mod?.provider_type ?? "",
    main_tf: mod?.main_tf ?? "",
    variables_tf: mod?.variables_tf ?? "",
    outputs_tf: mod?.outputs_tf ?? "",
    credential_env_keys: credKeys,
    tfvars_mapping_json: mod?.tfvars_mapping_json
      ? JSON.stringify(mod.tfvars_mapping_json, null, 2)
      : JSON.stringify({ environment_configuration: {}, instance_configurations: {} }, null, 2),
    mapping_mode: "visual",
  }
}

// ─── TfvarsMapping types ──────────────────────────────────────────────────────

interface MappingState {
  environment_configuration: Record<string, string>
  instance_configurations: Record<string, Record<string, string>>
}

function toStringRecord(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {}
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      typeof v === "string" ? v : "",
    ])
  )
}

function parseMappingJson(raw: string): MappingState | null {
  try {
    const parsed = JSON.parse(raw)
    const instCfg = parsed.instance_configurations ?? {}
    return {
      environment_configuration: toStringRecord(parsed.environment_configuration),
      instance_configurations: Object.fromEntries(
        Object.entries(instCfg as Record<string, unknown>).map(([k, v]) => [k, toStringRecord(v)])
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
  templateId: string
  versionId: string
  version: TemplateVersion
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TerraformModuleTab({ templateId, versionId, version }: Props) {
  const { currentOrg } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [configuredProviders, setConfiguredProviders] = useState<TerraformProviderType[]>([])
  const [activeProvider, setActiveProvider] = useState<TerraformProviderType>("")
  const [module, setModule] = useState<TerraformModule | null>(null)
  const [missingModule, setMissingModule] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [hclTab, setHclTab] = useState<"main" | "variables" | "outputs">("main")
  const [form, setForm] = useState<TfForm>(defaultForm())

  // Load provider catalog from backend (cloud-only)
  const loadProviders = useCallback(async () => {
    if (!currentOrg) return
    setLoadingProviders(true)
    try {
      const list = await providersApi.list(String(currentOrg.id))
      const cloudProviders = (list as Provider[]).filter((p) => p.type === "CLOUD")
      setProviders(cloudProviders)
      if (!activeProvider && cloudProviders.length) {
        setActiveProvider(cloudProviders[0].slug as TerraformProviderType)
      }
    } finally {
      setLoadingProviders(false)
    }
  }, [activeProvider])

  // Load the list of configured providers
  const loadList = useCallback(async () => {
    setLoadingList(true)
    try {
      const mods = await templatesApi.listTerraformModules(templateId, versionId)
      const providers = (mods as TerraformModule[]).map((m) => m.provider_type)
      setConfiguredProviders(providers)
    } catch {
      setConfiguredProviders([])
    } finally {
      setLoadingList(false)
    }
  }, [templateId, versionId])

  // Load module for the active provider tab
  const loadModule = useCallback(async (providerType: TerraformProviderType) => {
    if (!providerType) return
    setLoading(true)
    setError(null)
    try {
      const mod = await templatesApi.getTerraformModule(templateId, versionId, providerType)
      setModule(mod)
      setForm(defaultForm(mod))
      setMissingModule(false)
    } catch (e: any) {
      if (e?.status === 404 || e?.message?.includes("404")) {
        setModule(null)
        setForm(defaultForm(null))
        setMissingModule(true)
      } else {
        setError(e?.message ?? "Failed to load Terraform configuration")
      }
    } finally {
      setLoading(false)
    }
  }, [templateId, versionId])

  useEffect(() => { loadProviders() }, [loadProviders])
  useEffect(() => { loadList() }, [loadList])
  useEffect(() => { if (activeProvider) loadModule(activeProvider) }, [loadModule, activeProvider])

  const patch = (partial: Partial<TfForm>) => setForm((f) => ({ ...f, ...partial }))

  const createMissingModule = async () => {
    const provider = providers.find((p) => p.slug === activeProvider)
    const moduleSlug = provider?.default_module_slug ?? undefined
    setCreating(true)
    setSaveError(null)
    try {
      const created = await templatesApi.upsertTerraformModule(
        templateId,
        versionId,
        activeProvider,
        moduleSlug ? { module_slug: moduleSlug } : {},
      )
      setModule(created)
      setForm(defaultForm(created))
      setMissingModule(false)
    } catch (e: any) {
      setSaveError(e?.message ?? "Falha ao criar o template HCL")
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    setSaveError(null)
    setSaving(true)
    setSaved(false)

    let parsedMapping = null
    if (form.tfvars_mapping_json.trim()) {
      parsedMapping = parseMappingJson(form.tfvars_mapping_json)
      if (!parsedMapping) {
        setSaveError("Invalid JSON in variables mapping")
        setSaving(false)
        return
      }
    }

    try {
      const payload: Omit<Partial<TerraformModule>, "provider_type"> = {
        credential_env_keys: form.credential_env_keys.filter(Boolean),
        tfvars_mapping_json: parsedMapping ?? undefined,
      }

      payload.main_tf = form.main_tf || undefined
      payload.variables_tf = form.variables_tf || undefined
      payload.outputs_tf = form.outputs_tf || undefined

      const updated = await templatesApi.upsertTerraformModule(templateId, versionId, activeProvider, payload)
      setModule(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // refresh the list of configured providers
      if (!configuredProviders.includes(activeProvider)) {
        setConfiguredProviders((prev) => [...prev, activeProvider])
      }
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleProviderSwitch = (p: TerraformProviderType) => {
    setActiveProvider(p)
    setError(null)
    setSaveError(null)
    setSaved(false)
    setMissingModule(false)
    setForm(defaultForm(null))
  }

  if (loadingList || loadingProviders) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />Loading Terraform configurations…
      </div>
    )
  }

  const providerTabs = providers

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" />{error}
      </div>
    )
  }

  // Extract definition fields for visual mapping
  const def = version.definition_json
  const expFields = def?.environment_configuration?.sections?.flatMap((s) =>
    s.fields.map((f) => ({ sectionLabel: s.label, ...f }))
  ) ?? []
  const instanceEntries = Object.entries(def?.instance_configurations ?? {})

  // Parse current mapping for visual editor
  const mappingParsed = parseMappingJson(form.tfvars_mapping_json)

  const updateExpMapping = (fieldName: string, tfVar: string) => {
    const m = parseMappingJson(form.tfvars_mapping_json) ?? { environment_configuration: {}, instance_configurations: {} }
    m.environment_configuration[fieldName] = tfVar
    patch({ tfvars_mapping_json: mappingToJson(m) })
  }

  const updateInstMapping = (instanceKey: string, fieldName: string, tfVar: string) => {
    const m = parseMappingJson(form.tfvars_mapping_json) ?? { environment_configuration: {}, instance_configurations: {} }
    if (!m.instance_configurations[instanceKey]) m.instance_configurations[instanceKey] = {}
    m.instance_configurations[instanceKey][fieldName] = tfVar
    patch({ tfvars_mapping_json: mappingToJson(m) })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Provider tabs */}
      {providerTabs.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          Nenhum provedor cloud cadastrado. Cadastre um provedor para configurar Terraform modules.
        </div>
      ) : (
        <div className="flex gap-0 rounded-lg border border-border overflow-hidden text-xs w-fit">
          {providerTabs.map((p) => {
            const isConfigured = configuredProviders.includes(p.slug as TerraformProviderType)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderSwitch(p.slug as TerraformProviderType)}
                className={cn(
                  "relative px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5",
                  activeProvider === p.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                {p.name}
                {isConfigured && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Configured" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : module ? (
            <Badge variant="outline" className="text-[11px] gap-1 text-green-600 border-green-500/30 bg-green-500/5">
              <CheckCircle2 className="h-3 w-3" />{activeProvider.toUpperCase()} configured
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] gap-1 text-amber-600 border-amber-500/30 bg-amber-500/5">
              <AlertTriangle className="h-3 w-3" />{activeProvider.toUpperCase()} not configured
            </Badge>
          )}
          {module?.is_built_in && (
            <Badge variant="secondary" className="text-[11px]">Built-in: {module.module_slug}</Badge>
          )}
          {module?.has_custom_hcl && (
            <Badge variant="secondary" className="text-[11px] gap-1"><Code2 className="h-3 w-3" />Custom HCL</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />Saved
            </span>
          )}
          {saveError && (
            <span className="text-xs text-destructive">{saveError}</span>
          )}
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>

      {missingModule && !loading && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Template HCL para {activeProvider.toUpperCase()} não encontrado. Crie para habilitar o provisionamento.</span>
          </div>
          <Button size="sm" variant="outline" className="gap-1" onClick={createMissingModule} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Criar Template HCL
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />Loading {activeProvider.toUpperCase()} configuration…
        </div>
      ) : (<>

      {/* 1. HCL FILES ─────────────────────────────────────────────────────── */}
      <Section
        title="HCL Files"
        description="Provide the Terraform configuration files for this template version."
      >
        {/* File tabs */}
        <div className="flex gap-0 rounded-t-lg border border-border overflow-hidden text-xs">
          {HCL_TABS.map((t) => {
            const hasContent = !!form[t.key]?.trim()
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setHclTab(t.id as any)}
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
              value={form[t.key]}
              onChange={(e) => patch({ [t.key]: e.target.value } as any)}
              placeholder={`# ${t.label} content…`}
              className="font-mono text-xs leading-relaxed rounded-t-none border-t-0 min-h-[260px] resize-y bg-muted/20"
              spellCheck={false}
            />
          </div>
        ))}
      </Section>

      <Separator />

      {/* 3. VARIABLES MAPPING ─────────────────────────────────────────────── */}
      <Section
        title="Variables Mapping"
        description="Map definition form fields to Terraform variable names. When empty, the built-in mapping for the selected provider is used."
        action={
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => patch({ mapping_mode: form.mapping_mode === "visual" ? "raw" : "visual" })}
          >
            {form.mapping_mode === "visual" ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {form.mapping_mode === "visual" ? "Raw JSON" : "Visual editor"}
          </button>
        }
      >
        {form.mapping_mode === "raw" ? (
          <div className="flex flex-col gap-1">
            <Textarea
              value={form.tfvars_mapping_json}
              onChange={(e) => patch({ tfvars_mapping_json: e.target.value })}
              className="font-mono text-xs leading-relaxed min-h-[200px] resize-y bg-muted/20"
              spellCheck={false}
              placeholder='{ "environment_configuration": {}, "instance_configurations": {} }'
            />
            {parseMappingJson(form.tfvars_mapping_json) === null && form.tfvars_mapping_json.trim() && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />Invalid JSON
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Environment configuration mapping */}
            {expFields.length > 0 ? (
              <MappingGroup
                title="Environment Configuration"
                fields={expFields.map((f) => ({ name: f.name, label: f.label, sectionLabel: f.sectionLabel }))}
                mapping={mappingParsed?.environment_configuration ?? {}}
                onUpdate={(fieldName, tfVar) => updateExpMapping(fieldName, tfVar)}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No environment configuration fields defined in this version's definition.
              </p>
            )}

            {/* Instance configurations mapping */}
            {instanceEntries.map(([key, cfg]) => {
              const instFields = cfg.sections?.flatMap((s: any) =>
                s.fields?.map((f: any) => ({ name: f.name, label: f.label, sectionLabel: s.label })) ?? []
              ) ?? []
              return (
                <MappingGroup
                  key={key}
                  title={`Instance: ${cfg.label ?? key}`}
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
                  No fields from definition available. Define the environment configuration first, or use Raw JSON mode.
                </p>
              </div>
            )}
          </div>
        )}
      </Section>

      <Separator />

      {/* 4. CREDENTIAL ENV KEYS ───────────────────────────────────────────── */}
      <Section
        title="Credential ENV Keys"
        description="Environment variable names that will be injected from the provider credentials into the Terraform workspace container."
      >
        <div className="flex flex-col gap-2">
          {form.credential_env_keys.map((key, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="h-8 text-xs font-mono flex-1"
                value={key}
                onChange={(e) => {
                  const keys = [...form.credential_env_keys]
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
                  const keys = form.credential_env_keys.filter((_, idx) => idx !== i)
                  patch({ credential_env_keys: keys })
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
            onClick={() => patch({ credential_env_keys: [...form.credential_env_keys, ""] })}
          >
            <Plus className="h-3.5 w-3.5" />Add env key
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Common examples: <code className="font-mono">AWS_ACCESS_KEY_ID</code>, <code className="font-mono">GOOGLE_APPLICATION_CREDENTIALS</code>
          </p>
        </div>
      </Section>
      </>)}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title, description, action, children,
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

// ─── Mapping group ────────────────────────────────────────────────────────────

interface MappingField {
  name: string
  label: string
  sectionLabel?: string
}

function MappingGroup({
  title, subtitle, fields, mapping, onUpdate,
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
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <span className="text-xs font-medium">{title}</span>
        {subtitle && <code className="text-[11px] text-muted-foreground font-mono">{subtitle}</code>}
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
