"use client"

import { useState } from "react"
import { Loader2, Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { templatesApi } from "@/lib/api/templates"
import { parseOutputsMappingJson } from "../outputs-mapping-editor"
import type { ProviderConfiguration, TemplateDefinition } from "@/lib/api/types"
import { defaultTfForm, defaultAnsibleForm, ProviderMultiSelect } from "./shared"
import type { TerraformForm, AnsibleForm } from "./shared"
import { TerraformSection } from "./terraform-section"
import { AnsibleSection } from "./ansible-section"

interface ConfigEditorProps {
  templateId: string
  versionId: string
  config: ProviderConfiguration
  definition?: TemplateDefinition | null
  onUpdated: (cfg: ProviderConfiguration) => void
}

export function ConfigEditor({ templateId, versionId, config, definition, onUpdated }: ConfigEditorProps) {
  const [name, setName] = useState(config.name)
  const [providers, setProviders] = useState<string[]>(config.applies_to_providers)
  const [tfForm, setTfForm] = useState<TerraformForm>(defaultTfForm(config.terraform_module ?? undefined))
  const [ansibleForm, setAnsibleForm] = useState<AnsibleForm>(defaultAnsibleForm(config.ansible_playbook ?? undefined))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCredKeyTf, setNewCredKeyTf] = useState("")
  const [newCredKeyAns, setNewCredKeyAns] = useState("")

  const expFields = definition?.environment_configuration?.sections?.flatMap((s) =>
    s.fields.map((f) => ({ name: f.name, label: f.label }))
  ) ?? []

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await templatesApi.updateProviderConfiguration(templateId, versionId, config.id, {
        name: name.trim() || config.name,
        applies_to_providers: providers,
      })

      let tfMappingJson: unknown = null
      try { tfMappingJson = JSON.parse(tfForm.tfvars_mapping_json) } catch { /* ignore */ }
      let tfOutputsJson: unknown = null
      try { tfOutputsJson = parseOutputsMappingJson(tfForm.outputs_mapping_json) } catch { /* ignore */ }

      const updatedConfig = await templatesApi.upsertProviderConfigTerraform(templateId, versionId, config.id, {
        main_tf: tfForm.main_tf || undefined,
        variables_tf: tfForm.variables_tf || undefined,
        outputs_tf: tfForm.outputs_tf || undefined,
        credential_env_keys: tfForm.credential_env_keys.filter(Boolean),
        tfvars_mapping_json: tfMappingJson ?? undefined,
        outputs_mapping_json: tfOutputsJson ?? undefined,
      })

      let varsMappingJson: unknown = null
      try { varsMappingJson = JSON.parse(ansibleForm.vars_mapping_json) } catch { /* ignore */ }
      let ansOutputsJson: unknown = null
      try { ansOutputsJson = parseOutputsMappingJson(ansibleForm.outputs_mapping_json) } catch { /* ignore */ }
      let rolesValue: unknown = null
      try { rolesValue = JSON.parse(ansibleForm.roles_json) } catch { /* ignore */ }

      const finalConfig = await templatesApi.upsertProviderConfigAnsible(templateId, versionId, config.id, {
        playbook_yaml: ansibleForm.playbook_yaml || undefined,
        inventory_template: ansibleForm.inventory_template || undefined,
        credential_env_keys: ansibleForm.credential_env_keys.filter(Boolean),
        vars_mapping_json: varsMappingJson ?? undefined,
        outputs_mapping_json: ansOutputsJson ?? undefined,
        roles_json: rolesValue ?? undefined,
      })

      onUpdated(finalConfig as ProviderConfiguration)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e?.message ?? "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Configuration name</Label>
            <Input className="h-7 text-xs w-48" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Applies to providers</Label>
            <ProviderMultiSelect value={providers} onChange={setProviders} />
          </div>
        </div>
      </div>

      <TerraformSection
        config={config}
        tfForm={tfForm}
        onTfFormChange={setTfForm}
        expFields={expFields}
        newCredKeyTf={newCredKeyTf}
        onNewCredKeyTfChange={setNewCredKeyTf}
      />

      <AnsibleSection
        config={config}
        ansibleForm={ansibleForm}
        onAnsibleFormChange={setAnsibleForm}
        expFields={expFields}
        newCredKeyAns={newCredKeyAns}
        onNewCredKeyAnsChange={setNewCredKeyAns}
      />

      <div className="flex items-center gap-3">
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />Saved
          </span>
        )}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  )
}
