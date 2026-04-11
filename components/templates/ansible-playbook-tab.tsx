"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, Save, AlertTriangle, CheckCircle2, Eye, EyeOff, Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import type { TemplateVersion } from "@/lib/api/types"
import {
  defaultForm, parseVarsJson, varsMappingToJson,
  parseOutputsJson, outputsToJson,
  type AnsibleTabForm, type VarsMapping, type OutputResource,
} from "./ansible-playbook-tab/types"
import { VarsMappingEditor } from "./ansible-playbook-tab/vars-mapping-editor"
import { AnsibleOutputsMappingEditor } from "./ansible-playbook-tab/ansible-outputs-mapping-editor"
import { NewProviderButton } from "./ansible-playbook-tab/new-provider-button"
import { CredentialEnvKeys } from "./ansible-playbook-tab/credential-env-keys"

interface Props {
  templateId: string
  versionId: string
  version: TemplateVersion
}

export function AnsiblePlaybookTab({ templateId, versionId, version }: Props) {
  const { currentOrg } = useAuth()
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([])
  const [allProviderTypes, setAllProviderTypes]         = useState<string[]>([])
  const [activeProvider, setActiveProvider]             = useState<string>("")
  const [missingPlaybook, setMissingPlaybook]           = useState(false)
  const [loadingList, setLoadingList]                   = useState(true)
  const [loadingProviders, setLoadingProviders]         = useState(true)
  const [saving, setSaving]                             = useState(false)
  const [saved, setSaved]                               = useState(false)
  const [error, setError]                               = useState<string | null>(null)
  const [form, setForm]                                 = useState<AnsibleTabForm>(defaultForm())
  const [showInventory, setShowInventory]               = useState(false)
  const [varsMode, setVarsMode]                         = useState<"visual" | "raw">("visual")
  const [outputsMode, setOutputsMode]                   = useState<"visual" | "raw">("visual")
  const [outputResources, setOutputResources]           = useState<OutputResource[]>([])
  const [varsMapping, setVarsMapping]                   = useState<VarsMapping>({ environment_configuration: {} })

  useEffect(() => {
    if (!currentOrg?.id) return
    setLoadingProviders(true)
    providersApi.list(currentOrg.id)
      .then((ps) => setAllProviderTypes((prev) => Array.from(new Set([...prev, ...ps.map((p) => p.type)]))))
      .catch(() => {}).finally(() => setLoadingProviders(false))
  }, [currentOrg?.id])

  const loadPlaybooks = useCallback(async () => {
    setLoadingList(true)
    try {
      const playbooks = await templatesApi.listAnsiblePlaybooks(templateId, versionId)
      const types = playbooks.map((p) => p.provider_type ?? "").filter(Boolean)
      setConfiguredProviders(types)
      setAllProviderTypes((prev) => Array.from(new Set([...prev, ...types])))
      if (types.length > 0 && !activeProvider) setActiveProvider(types[0])
    } catch { setConfiguredProviders([]) } finally { setLoadingList(false) }
  }, [templateId, versionId, activeProvider])

  useEffect(() => { loadPlaybooks() }, [versionId])

  useEffect(() => {
    if (!activeProvider) { setForm(defaultForm()); return }
    setMissingPlaybook(false)
    templatesApi.getAnsiblePlaybook(templateId, versionId, activeProvider)
      .then((p) => { const f = defaultForm(p); setForm(f); setVarsMapping(parseVarsJson(f.vars_mapping_json) ?? { environment_configuration: {} }); setOutputResources(parseOutputsJson(f.outputs_mapping_json)) })
      .catch(() => { const f = defaultForm(); f.provider_type = activeProvider; setForm(f); setVarsMapping({ environment_configuration: {} }); setOutputResources([]); setMissingPlaybook(true) })
  }, [templateId, versionId, activeProvider])

  const handleSave = async () => {
    if (!activeProvider) return
    setSaving(true); setSaved(false); setError(null)
    try {
      const varsMappingJson = JSON.parse(form.vars_mapping_json)
      if (varsMode === "visual") varsMappingJson.environment_configuration = varsMapping.environment_configuration
      const outputsMappingValue = outputsMode === "visual" ? JSON.parse(outputsToJson(outputResources)) : JSON.parse(form.outputs_mapping_json)
      let rolesValue: unknown = null
      try { rolesValue = JSON.parse(form.roles_json) } catch { /* ignore */ }
      await templatesApi.upsertAnsiblePlaybook(templateId, versionId, activeProvider, {
        playbook_yaml: form.playbook_yaml || undefined, inventory_template: form.inventory_template || undefined,
        credential_env_keys: form.credential_env_keys.filter(Boolean),
        vars_mapping_json: varsMappingJson, outputs_mapping_json: outputsMappingValue, roles_json: rolesValue as any,
      })
      setSaved(true); setMissingPlaybook(false); loadPlaybooks()
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) { setError(e?.message ?? "Failed to save") } finally { setSaving(false) }
  }

  const handleVarsChange = (next: VarsMapping) => { setVarsMapping(next); setForm((f) => ({ ...f, vars_mapping_json: varsMappingToJson(next) })) }
  const handleOutputsChange = (next: OutputResource[]) => { setOutputResources(next); setForm((f) => ({ ...f, outputs_mapping_json: outputsToJson(next) })) }

  if (loadingList || loadingProviders) return <div className="flex items-center gap-2 text-sm text-muted-foreground py-6"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 flex-wrap">
        {allProviderTypes.map((pt) => (
          <button key={pt} onClick={() => setActiveProvider(pt)}
            className={cn("inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors",
              activeProvider === pt ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")}>
            <Terminal className="h-3 w-3" />{pt}
            {configuredProviders.includes(pt) && <span className="h-1.5 w-1.5 rounded-full bg-green-500 ml-0.5" />}
          </button>
        ))}
        <NewProviderButton existing={allProviderTypes} onAdd={(pt) => { setActiveProvider(pt); setAllProviderTypes((prev) => Array.from(new Set([...prev, pt]))) }} />
      </div>

      {!activeProvider && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Terminal className="h-4 w-4" />Select or add a provider type to configure its playbook.
        </div>
      )}

      {activeProvider && (
        <>
          {missingPlaybook && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />No playbook configured for <strong>{activeProvider}</strong> yet.
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">playbook.yml</Label>
            <Textarea className="font-mono text-xs min-h-[220px] leading-relaxed resize-y" placeholder={"- hosts: all\n  become: yes\n  tasks:\n    - name: ..."}
              value={form.playbook_yaml} onChange={(e) => setForm((f) => ({ ...f, playbook_yaml: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">inventory.ini template <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-normal text-muted-foreground">HPC / ON_PREM</span></Label>
              <button type="button" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground" onClick={() => setShowInventory((v) => !v)}>
                {showInventory ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{showInventory ? "Hide" : "Show"}
              </button>
            </div>
            {showInventory && <Textarea className="font-mono text-xs min-h-[100px] leading-relaxed resize-y" placeholder={"[hpc_nodes]\n{{ head_node_ip }} ansible_user={{ ssh_user }}"} value={form.inventory_template} onChange={(e) => setForm((f) => ({ ...f, inventory_template: e.target.value }))} />}
          </div>
          <Separator />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div><h4 className="text-xs font-semibold">Input Variables Mapping</h4><p className="text-[11px] text-muted-foreground mt-0.5">Maps environment_configuration to playbook variables</p></div>
              <div className="flex items-center rounded border border-border text-[11px] overflow-hidden">
                <button className={cn("px-2 py-0.5 transition-colors", varsMode === "visual" ? "bg-muted font-medium" : "hover:bg-muted/50")} onClick={() => setVarsMode("visual")}>Visual</button>
                <button className={cn("px-2 py-0.5 transition-colors", varsMode === "raw" ? "bg-muted font-medium" : "hover:bg-muted/50")} onClick={() => setVarsMode("raw")}>Raw JSON</button>
              </div>
            </div>
            {varsMode === "visual" ? <VarsMappingEditor value={varsMapping} onChange={handleVarsChange} /> : <Textarea className="font-mono text-xs min-h-[140px] resize-y" value={form.vars_mapping_json} onChange={(e) => { setForm((f) => ({ ...f, vars_mapping_json: e.target.value })); const p = parseVarsJson(e.target.value); if (p) setVarsMapping(p) }} />}
          </div>
          <Separator />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div><h4 className="text-xs font-semibold">Output Variables Mapping</h4><p className="text-[11px] text-muted-foreground mt-0.5">Maps ansible_outputs.json keys to ProvisionedResource fields</p></div>
              <div className="flex items-center rounded border border-border text-[11px] overflow-hidden">
                <button className={cn("px-2 py-0.5 transition-colors", outputsMode === "visual" ? "bg-muted font-medium" : "hover:bg-muted/50")} onClick={() => setOutputsMode("visual")}>Visual</button>
                <button className={cn("px-2 py-0.5 transition-colors", outputsMode === "raw" ? "bg-muted font-medium" : "hover:bg-muted/50")} onClick={() => setOutputsMode("raw")}>Raw JSON</button>
              </div>
            </div>
            {outputsMode === "visual" ? <AnsibleOutputsMappingEditor resources={outputResources} onChange={handleOutputsChange} /> : <Textarea className="font-mono text-xs min-h-[140px] resize-y" value={form.outputs_mapping_json} onChange={(e) => { setForm((f) => ({ ...f, outputs_mapping_json: e.target.value })); setOutputResources(parseOutputsJson(e.target.value)) }} />}
          </div>
          <Separator />
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold">Credential Environment Keys</h4>
            <CredentialEnvKeys keys={form.credential_env_keys} onChange={(keys) => setForm((f) => ({ ...f, credential_env_keys: keys }))} />
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold">Playbook Roles <span className="font-normal text-muted-foreground">(optional)</span></h4>
            <Textarea className="font-mono text-xs min-h-[80px] resize-y" placeholder={'[{"name": "geerlingguy.docker", "version": "6.1.0"}]'} value={form.roles_json} onChange={(e) => setForm((f) => ({ ...f, roles_json: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save
            </Button>
            {saved && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Saved</span>}
            {error && <span className="text-xs text-destructive">{error}</span>}
          </div>
        </>
      )}
    </div>
  )
}
