"use client"

import { useState } from "react"
import { Terminal, Eye, EyeOff } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { SectionCard } from "./section-card"
import { CredentialKeysEditor } from "./credential-keys-editor"
import { OutputsMappingEditor } from "../outputs-mapping-editor"
import { PlaybookTasksEditor } from "./playbook-tasks-editor"
import type { TaskDraft } from "./playbook-task-card"
import type { AnsibleForm } from "./shared"
import type { ProviderConfiguration } from "@/lib/api/types"

interface AnsibleSectionProps {
  config: ProviderConfiguration
  ansibleForm: AnsibleForm
  onAnsibleFormChange: (form: AnsibleForm) => void
  expFields: { name: string; label: string }[]
}

export function AnsibleSection({ config, ansibleForm, onAnsibleFormChange, expFields }: AnsibleSectionProps) {
  const [showInventory, setShowInventory] = useState(false)
  const [tasks, setTasks] = useState<TaskDraft[]>([])

  return (
    <SectionCard
      title="Ansible"
      icon={<Terminal className="h-3.5 w-3.5 text-green-500" />}
      badge={config.ansible_playbook?.has_custom_playbook ? "Configured" : undefined}
      hint="optional"
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">playbook.yml</Label>
        <PlaybookTasksEditor
          yaml={ansibleForm.playbook_yaml}
          onYamlChange={(yaml) => onAnsibleFormChange({ ...ansibleForm, playbook_yaml: yaml })}
          tasks={tasks}
          onTasksChange={setTasks}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">
            inventory.ini template
            <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-normal text-muted-foreground">HPC / ON_PREM</span>
          </Label>
          <button type="button" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setShowInventory((v) => !v)}>
            {showInventory ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showInventory ? "Hide" : "Show"}
          </button>
        </div>
        {showInventory && (
          <Textarea
            className="font-mono text-xs min-h-[80px] resize-y"
            placeholder={"[hpc_nodes]\n{{ head_node_ip }} ansible_user={{ ssh_user }}"}
            value={ansibleForm.inventory_template}
            onChange={(e) => onAnsibleFormChange({ ...ansibleForm, inventory_template: e.target.value })}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold">Variables Mapping</Label>
        {expFields.length > 0 ? (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr] gap-x-2 px-3 py-1.5 bg-muted/30 text-[11px] text-muted-foreground">
              <span>definition field</span><span>ansible variable</span>
            </div>
            {expFields.map((f) => {
              let mapping: Record<string, string> = {}
              try { mapping = JSON.parse(ansibleForm.vars_mapping_json)?.environment_configuration ?? {} } catch { /* ignore */ }
              return (
                <div key={f.name} className="grid grid-cols-[1fr_1fr] gap-x-2 px-3 py-1 border-t border-border/50 items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{f.label}</span>
                    <code className="text-[10px] text-muted-foreground">{f.name}</code>
                  </div>
                  <Input
                    className="h-6 text-xs font-mono"
                    value={mapping[f.name] ?? ""}
                    placeholder="ansible_var"
                    onChange={(e) => {
                      let m: Record<string, unknown> = {}
                      try { m = JSON.parse(ansibleForm.vars_mapping_json) } catch { /* ignore */ }
                      const ec = (m.environment_configuration as Record<string, string>) ?? {}
                      ec[f.name] = e.target.value
                      m.environment_configuration = ec
                      onAnsibleFormChange({ ...ansibleForm, vars_mapping_json: JSON.stringify(m, null, 2) })
                    }}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <Textarea
            className="font-mono text-xs min-h-[100px] resize-y"
            value={ansibleForm.vars_mapping_json}
            onChange={(e) => onAnsibleFormChange({ ...ansibleForm, vars_mapping_json: e.target.value })}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold">Outputs Mapping</Label>
        <OutputsMappingEditor
          value={ansibleForm.outputs_mapping_json}
          onChange={(raw) => onAnsibleFormChange({ ...ansibleForm, outputs_mapping_json: raw })}
        />
      </div>

      <CredentialKeysEditor
        value={ansibleForm.credential_env_keys}
        onChange={(keys) => onAnsibleFormChange({ ...ansibleForm, credential_env_keys: keys })}
        placeholder="SSH_PRIVATE_KEY"
      />

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">
          Ansible Galaxy Roles <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          className="font-mono text-xs min-h-[60px] resize-y"
          placeholder={'[{"name": "geerlingguy.docker", "version": "6.1.0"}]'}
          value={ansibleForm.roles_json}
          onChange={(e) => onAnsibleFormChange({ ...ansibleForm, roles_json: e.target.value })}
        />
      </div>
    </SectionCard>
  )
}
