"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, Code2, Eye, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlaybookTasksEditor } from "./provider-config/playbook-tasks-editor"
import type { TaskDraft } from "./provider-config/playbook-task-card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { TemplateDefinition } from "@/lib/api/types"
import { OutputsMappingEditor } from "./outputs-mapping-editor"
import {
  ANSIBLE_PROVIDER_TYPES, INVENTORY_PROVIDERS,
  defaultAnsibleDraft, parseVarsMappingJson, varsMappingToJson, parseRoles,
  type AnsibleDraft, type VarsMappingState,
} from "./ansible-playbook-step/types"
import { Section } from "./ansible-playbook-step/section"
import { MappingGroup } from "./ansible-playbook-step/mapping-group"

export type { AnsibleDraft } from "./ansible-playbook-step/types"
export { defaultAnsibleDraft, ansibleDraftToPayload, ansibleDraftIsConfigured, ANSIBLE_PROVIDER_TYPES } from "./ansible-playbook-step/types"

function providerLabel(slug: string): string {
  return ANSIBLE_PROVIDER_TYPES.find((p) => p.value === slug)?.label ?? slug.toUpperCase()
}

interface Props {
  definition?: TemplateDefinition | null
  value: AnsibleDraft[]
  onChange: (v: AnsibleDraft[]) => void
}

export function AnsiblePlaybookStep({ definition, value, onChange }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [varsMappingMode, setVarsMappingMode] = useState<"visual" | "raw">("visual")
  const [tasksByProvider, setTasksByProvider] = useState<Record<string, TaskDraft[]>>({})

  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  // ── Sync provider tabs with definition.providers ──────────────────────────
  const providersKey = (definition?.providers ?? []).join(",")
  useEffect(() => {
    const defProviders = definition?.providers ?? []
    if (defProviders.length === 0) return
    const current = valueRef.current
    const existingSlugs = current.map((d) => d.provider_type)
    const toAdd = defProviders.filter((p) => !existingSlugs.includes(p))
    if (toAdd.length > 0) {
      onChange([
        ...current,
        ...toAdd.map((p) => ({ ...defaultAnsibleDraft(), provider_type: p })),
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
      const m: VarsMappingState = parseVarsMappingJson(draft.vars_mapping_json) ?? { environment_configuration: {} }
      let changed = false
      const fieldNames = definition.environment_configuration?.sections?.flatMap((s) => s.fields.map((f) => f.name)) ?? []
      for (const name of fieldNames) {
        if (!m.environment_configuration[name]) { m.environment_configuration[name] = name; changed = true }
      }
      if (changed) anyChanged = true
      return changed ? { ...draft, vars_mapping_json: varsMappingToJson(m) } : draft
    })
    if (anyChanged) onChange(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition])

  const current = value[selectedIndex] ?? defaultAnsibleDraft()

  const patchCurrent = (partial: Partial<AnsibleDraft>) => {
    const updated = [...value]
    updated[selectedIndex] = { ...current, ...partial }
    onChange(updated)
  }

  const removeProvider = (index: number) => {
    if (value.length <= 1) return
    onChange(value.filter((_, i) => i !== index))
    setSelectedIndex(Math.max(0, index <= selectedIndex ? selectedIndex - 1 : selectedIndex))
  }

  const expFields = definition?.environment_configuration?.sections?.flatMap((s) =>
    s.fields.map((f) => ({ sectionLabel: s.label, ...f }))
  ) ?? []

  const varsMappingParsed = parseVarsMappingJson(current.vars_mapping_json)
  const updateVarsMapping = (fieldName: string, ansibleVar: string) => {
    const m = parseVarsMappingJson(current.vars_mapping_json) ?? { environment_configuration: {} }
    m.environment_configuration[fieldName] = ansibleVar
    patchCurrent({ vars_mapping_json: varsMappingToJson(m) })
  }

  const needsInventory = INVENTORY_PROVIDERS.has(current.provider_type)
  const defProviders = definition?.providers ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Provider tab bar */}
      <Section title="Ansible per Provider" description="Select a provider tab to configure its playbook and variable mapping.">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-0 rounded-lg border border-border overflow-hidden text-xs">
            {value.map((draft, i) => (
              <div key={i}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors border-r border-border last:border-r-0",
                  selectedIndex === i ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                <button type="button" onClick={() => setSelectedIndex(i)}>
                  {providerLabel(draft.provider_type)}
                </button>
                {value.length > 1 && !defProviders.includes(draft.provider_type) && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeProvider(i) }}
                    className={cn("rounded-full hover:opacity-80", selectedIndex === i ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1"
            onClick={() => { onChange([...value, { ...defaultAnsibleDraft(), provider_type: "custom" }]); setSelectedIndex(value.length) }}>
            <Plus className="h-3 w-3" />Custom
          </Button>
        </div>
        {defProviders.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Tabs auto-populated from: {defProviders.map(providerLabel).join(", ")}.
          </p>
        )}
      </Section>

      <Separator />

      <Section title="Playbook YAML" description={`The main playbook.yml that Ansible will execute for ${providerLabel(current.provider_type)}.`}>
        <PlaybookTasksEditor
          yaml={current.playbook_yaml}
          onYamlChange={(yaml) => patchCurrent({ playbook_yaml: yaml })}
          tasks={tasksByProvider[current.provider_type] ?? []}
          onTasksChange={(tasks) => setTasksByProvider((prev) => ({ ...prev, [current.provider_type]: tasks }))}
        />
      </Section>

      {needsInventory && (
        <>
          <Separator />
          <Section title="Inventory Template" description="INI-format inventory. Use {{ variable_name }} placeholders.">
            <Textarea value={current.inventory_template} onChange={(e) => patchCurrent({ inventory_template: e.target.value })}
              placeholder={"[all]\n{{ host_ip }} ansible_user={{ ssh_user }}"}
              className="font-mono text-xs leading-relaxed min-h-[160px] resize-y bg-muted/20" spellCheck={false} />
          </Section>
        </>
      )}

      <Separator />

      <Section title="Variables Mapping" description="Map definition form fields to Ansible extra_vars names."
        action={
          <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setVarsMappingMode((m) => (m === "visual" ? "raw" : "visual"))}>
            {varsMappingMode === "visual" ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {varsMappingMode === "visual" ? "Raw JSON" : "Visual editor"}
          </button>
        }
      >
        {varsMappingMode === "raw" ? (
          <div className="flex flex-col gap-1">
            <Textarea value={current.vars_mapping_json} onChange={(e) => patchCurrent({ vars_mapping_json: e.target.value })}
              className="font-mono text-xs leading-relaxed min-h-[180px] resize-y bg-muted/20" spellCheck={false}
              placeholder='{ "environment_configuration": {} }' />
            {parseVarsMappingJson(current.vars_mapping_json) === null && current.vars_mapping_json.trim() && (
              <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Invalid JSON</p>
            )}
          </div>
        ) : expFields.length > 0 ? (
          <MappingGroup title="Environment Configuration"
            fields={expFields.map((f) => ({ name: f.name, label: f.label, sectionLabel: f.sectionLabel }))}
            mapping={varsMappingParsed?.environment_configuration ?? {}}
            onUpdate={updateVarsMapping} />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">No fields available. Add fields in the Definition step or use Raw JSON mode.</p>
          </div>
        )}
      </Section>

      <Separator />

      <Section title="Outputs Mapping" description="Map ansible_outputs.json keys to AkoCloud provisioned-resource fields.">
        <OutputsMappingEditor value={current.outputs_mapping_json} onChange={(raw) => patchCurrent({ outputs_mapping_json: raw })} />
      </Section>

      <Separator />

      <Section title="Credential ENV Keys" description="Environment variables injected from provider credentials.">
        <div className="flex flex-col gap-2">
          {current.credential_env_keys.map((key, i) => (
            <div key={i} className="flex gap-2">
              <Input className="h-8 text-xs font-mono flex-1" value={key} placeholder="e.g. SSH_PRIVATE_KEY"
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

      <Separator />

      <Section title="Ansible Galaxy Roles" description="Roles to install via ansible-galaxy before running the playbook.">
        <div className="flex flex-col gap-2">
          {parseRoles(current.roles_json).map((role, i) => (
            <div key={i} className="flex gap-2">
              <Input className="h-8 text-xs font-mono flex-1" value={typeof role === "string" ? role : role.name}
                onChange={(e) => { const roles = parseRoles(current.roles_json); roles[i] = e.target.value; patchCurrent({ roles_json: JSON.stringify(roles, null, 2) }) }}
                placeholder="e.g. geerlingguy.docker" />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => { const roles = parseRoles(current.roles_json).filter((_, idx) => idx !== i); patchCurrent({ roles_json: JSON.stringify(roles, null, 2) }) }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-fit"
            onClick={() => { const roles = parseRoles(current.roles_json); patchCurrent({ roles_json: JSON.stringify([...roles, ""], null, 2) }) }}>
            <Plus className="h-3.5 w-3.5" />Add role
          </Button>
        </div>
      </Section>
    </div>
  )
}
