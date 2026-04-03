"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, Save, Plus, Trash2, AlertTriangle, CheckCircle2, Code2, Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import type { TemplateVersion, TerraformModule, TerraformProviderType, Provider } from "@/lib/api/types"
import { OutputsMappingEditor } from "./outputs-mapping-editor"
import { defaultForm, parseMappingJson, mappingToJson, HCL_TABS, type TfForm } from "./terraform-module-tab/types"
import { Section } from "./terraform-module-tab/section"
import { MappingGroup } from "./terraform-module-tab/mapping-group"

interface Props {
  templateId: string
  versionId: string
  version: TemplateVersion
}

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

  const patch = (partial: Partial<TfForm>) => setForm((f) => ({ ...f, ...partial }))

  const loadProviders = useCallback(async () => {
    if (!currentOrg) return
    setLoadingProviders(true)
    try {
      const list = await providersApi.list(String(currentOrg.id))
      setProviders(list as Provider[])
      if (!activeProvider && list.length) setActiveProvider((list[0] as Provider).slug as TerraformProviderType)
    } finally { setLoadingProviders(false) }
  }, [activeProvider])

  const loadList = useCallback(async () => {
    setLoadingList(true)
    try {
      const mods = await templatesApi.listTerraformModules(templateId, versionId)
      setConfiguredProviders((mods as TerraformModule[]).map((m) => m.provider_type))
    } catch { setConfiguredProviders([]) } finally { setLoadingList(false) }
  }, [templateId, versionId])

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
        setModule(null); setForm(defaultForm(null)); setMissingModule(true)
      } else { setError(e?.message ?? "Failed to load") }
    } finally { setLoading(false) }
  }, [templateId, versionId])

  useEffect(() => { loadProviders() }, [loadProviders])
  useEffect(() => { loadList() }, [loadList])
  useEffect(() => { if (activeProvider) loadModule(activeProvider) }, [loadModule, activeProvider])

  const createMissingModule = async () => {
    const provider = providers.find((p) => p.slug === activeProvider)
    setCreating(true)
    setSaveError(null)
    try {
      const created = await templatesApi.upsertTerraformModule(templateId, versionId, activeProvider,
        provider?.default_module_slug ? { module_slug: provider.default_module_slug } : {})
      setModule(created); setForm(defaultForm(created)); setMissingModule(false)
    } catch (e: any) { setSaveError(e?.message ?? "Failed to create") }
    finally { setCreating(false) }
  }

  const handleSave = async () => {
    setSaveError(null); setSaving(true); setSaved(false)
    const parsedMapping = form.tfvars_mapping_json.trim() ? parseMappingJson(form.tfvars_mapping_json) : null
    if (form.tfvars_mapping_json.trim() && !parsedMapping) {
      setSaveError("Invalid JSON in variables mapping"); setSaving(false); return
    }
    let parsedOutputsMapping = null
    if (form.outputs_mapping_json.trim()) {
      try { parsedOutputsMapping = JSON.parse(form.outputs_mapping_json) }
      catch { setSaveError("Invalid JSON in outputs mapping"); setSaving(false); return }
    }
    try {
      const payload: Omit<Partial<TerraformModule>, "provider_type"> = {
        main_tf: form.main_tf || undefined,
        variables_tf: form.variables_tf || undefined,
        outputs_tf: form.outputs_tf || undefined,
        credential_env_keys: form.credential_env_keys.filter(Boolean),
        tfvars_mapping_json: parsedMapping ?? undefined,
        outputs_mapping_json: parsedOutputsMapping ?? undefined,
      }
      const updated = await templatesApi.upsertTerraformModule(templateId, versionId, activeProvider, payload)
      setModule(updated); setSaved(true)
      if (!configuredProviders.includes(activeProvider))
        setConfiguredProviders((prev) => [...prev, activeProvider])
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { setSaveError(e?.message ?? "Failed to save") }
    finally { setSaving(false) }
  }

  const handleProviderSwitch = (p: TerraformProviderType) => {
    setActiveProvider(p); setError(null); setSaveError(null); setSaved(false)
    setMissingModule(false); setForm(defaultForm(null))
  }

  const expFields = version.definition_json?.environment_configuration?.sections?.flatMap((s) =>
    s.fields.map((f) => ({ sectionLabel: s.label, ...f }))
  ) ?? []
  const mappingParsed = parseMappingJson(form.tfvars_mapping_json)
  const updateExpMapping = (fieldName: string, tfVar: string) => {
    const m = parseMappingJson(form.tfvars_mapping_json) ?? { environment_configuration: {} }
    m.environment_configuration[fieldName] = tfVar
    patch({ tfvars_mapping_json: mappingToJson(m) })
  }

  if (loadingList || loadingProviders) {
    return <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
  }
  if (error) {
    return <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {providers.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          No cloud providers registered. Register a provider to configure Terraform modules.
        </div>
      ) : (
        <div className="flex gap-0 rounded-lg border border-border overflow-hidden text-xs w-fit">
          {providers.map((p) => (
            <button key={p.id} type="button" onClick={() => handleProviderSwitch(p.slug as TerraformProviderType)}
              className={cn(
                "relative px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5",
                activeProvider === p.slug ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50",
              )}
            >
              {p.name}
              {configuredProviders.includes(p.slug as TerraformProviderType) && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            : module
              ? <Badge variant="outline" className="text-[11px] gap-1 text-green-600 border-green-500/30 bg-green-500/5"><CheckCircle2 className="h-3 w-3" />{activeProvider.toUpperCase()} configured</Badge>
              : <Badge variant="outline" className="text-[11px] gap-1 text-amber-600 border-amber-500/30 bg-amber-500/5"><AlertTriangle className="h-3 w-3" />{activeProvider.toUpperCase()} not configured</Badge>}
          {module?.is_built_in && <Badge variant="secondary" className="text-[11px]">Built-in: {module.module_slug}</Badge>}
          {module?.has_custom_hcl && <Badge variant="secondary" className="text-[11px] gap-1"><Code2 className="h-3 w-3" />Custom HCL</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Saved</span>}
          {saveError && <span className="text-xs text-destructive">{saveError}</span>}
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save
          </Button>
        </div>
      </div>

      {missingModule && !loading && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />HCL template for {activeProvider.toUpperCase()} not found.
          </div>
          <Button size="sm" variant="outline" className="gap-1" onClick={createMissingModule} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Create HCL Template
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />Loading {activeProvider.toUpperCase()}…
        </div>
      ) : (
        <>
          <Section title="HCL Files" description="Terraform configuration files for this template version.">
            <div className="flex gap-0 rounded-t-lg border border-border overflow-hidden text-xs">
              {HCL_TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => setHclTab(t.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors font-mono",
                    hclTab === t.id ? "bg-muted/70 text-foreground border-b-2 border-primary" : "bg-background text-muted-foreground hover:bg-muted/30",
                  )}
                >
                  {t.label}
                  {!!form[t.key]?.trim() && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                </button>
              ))}
            </div>
            {HCL_TABS.map((t) => (
              <div key={t.id} className={hclTab === t.id ? "block" : "hidden"}>
                <Textarea value={form[t.key]} onChange={(e) => patch({ [t.key]: e.target.value } as any)}
                  placeholder={`# ${t.label} content…`}
                  className="font-mono text-xs leading-relaxed rounded-t-none border-t-0 min-h-[260px] resize-y bg-muted/20" spellCheck={false} />
              </div>
            ))}
          </Section>

          <Separator />

          <Section title="Variables Mapping" description="Map definition fields to Terraform variable names."
            action={
              <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => patch({ mapping_mode: form.mapping_mode === "visual" ? "raw" : "visual" })}>
                {form.mapping_mode === "visual" ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {form.mapping_mode === "visual" ? "Raw JSON" : "Visual editor"}
              </button>
            }
          >
            {form.mapping_mode === "raw" ? (
              <div className="flex flex-col gap-1">
                <Textarea value={form.tfvars_mapping_json} onChange={(e) => patch({ tfvars_mapping_json: e.target.value })}
                  className="font-mono text-xs leading-relaxed min-h-[200px] resize-y bg-muted/20" spellCheck={false}
                  placeholder='{ "environment_configuration": {} }' />
                {parseMappingJson(form.tfvars_mapping_json) === null && form.tfvars_mapping_json.trim() && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Invalid JSON</p>
                )}
              </div>
            ) : expFields.length > 0 ? (
              <MappingGroup
                title="Environment Configuration"
                fields={expFields.map((f) => ({ name: f.name, label: f.label, sectionLabel: f.sectionLabel }))}
                mapping={mappingParsed?.environment_configuration ?? {}}
                onUpdate={updateExpMapping}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">No definition fields available.</p>
            )}
          </Section>

          <Separator />

          <Section title="Outputs Mapping" description="Map Terraform outputs to AkoCloud provisioned-resource fields.">
            <OutputsMappingEditor value={form.outputs_mapping_json} onChange={(raw) => patch({ outputs_mapping_json: raw })} />
          </Section>

          <Separator />

          <Section title="Credential ENV Keys" description="Environment variable names injected from provider credentials.">
            <div className="flex flex-col gap-2">
              {form.credential_env_keys.map((key, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="h-8 text-xs font-mono flex-1" value={key} placeholder="e.g. AWS_ACCESS_KEY_ID"
                    onChange={(e) => { const keys = [...form.credential_env_keys]; keys[i] = e.target.value.toUpperCase().replace(/\s+/g, "_"); patch({ credential_env_keys: keys }) }} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => patch({ credential_env_keys: form.credential_env_keys.filter((_, idx) => idx !== i) })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-fit"
                onClick={() => patch({ credential_env_keys: [...form.credential_env_keys, ""] })}>
                <Plus className="h-3.5 w-3.5" />Add env key
              </Button>
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
