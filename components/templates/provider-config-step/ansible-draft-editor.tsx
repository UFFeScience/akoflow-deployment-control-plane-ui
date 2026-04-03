"use client"

import { useState } from "react"
import { Terminal, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { OutputsMappingEditor } from "../outputs-mapping-editor"
import { MappingEditor } from "./mapping-editor"
import { CredentialKeysEditor } from "./credential-keys-editor"
import type { AnsibleConfigDraft } from "./types"

interface AnsibleDraftEditorProps {
  value: AnsibleConfigDraft
  onChange: (v: AnsibleConfigDraft) => void
  enabled: boolean
  onToggle: (enabled: boolean) => void
  expFields: { name: string; label: string }[]
}

export function AnsibleDraftEditor({ value, onChange, enabled, onToggle, expFields }: AnsibleDraftEditorProps) {
  const [expanded, setExpanded] = useState(false)
  const [showInventory, setShowInventory] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-semibold">Ansible</h3>
          <span className="text-xs text-muted-foreground italic">optional</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className="rounded" />
            Enable
          </label>
        </div>
      </div>

      {enabled && expanded && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">playbook.yml</Label>
            <Textarea className="font-mono text-xs min-h-[160px] resize-y"
              value={value.playbook_yaml} onChange={(e) => onChange({ ...value, playbook_yaml: e.target.value })}
              placeholder={"- hosts: all\n  become: yes\n  tasks:\n    - name: ..."} />
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
              <Textarea className="font-mono text-xs min-h-[60px] resize-y"
                value={value.inventory_template} onChange={(e) => onChange({ ...value, inventory_template: e.target.value })}
                placeholder={"[hpc_nodes]\n{{ head_node_ip }} ansible_user={{ ssh_user }}"} />
            )}
          </div>

          <MappingEditor label="Variables Mapping" placeholder="ansible_var"
            jsonValue={value.vars_mapping_json} onJsonChange={(raw) => onChange({ ...value, vars_mapping_json: raw })}
            expFields={expFields} section="environment_configuration" />

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Outputs Mapping</Label>
            <OutputsMappingEditor value={value.outputs_mapping_json} onChange={(raw) => onChange({ ...value, outputs_mapping_json: raw })} />
          </div>

          <CredentialKeysEditor value={value.credential_env_keys} onChange={(keys) => onChange({ ...value, credential_env_keys: keys })} placeholder="SSH_PRIVATE_KEY" />

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">
              Ansible Galaxy Roles <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea className="font-mono text-xs min-h-[60px] resize-y"
              value={value.roles_json} onChange={(e) => onChange({ ...value, roles_json: e.target.value })}
              placeholder={'[{"name": "geerlingguy.docker", "version": "6.1.0"}]'} />
          </div>
        </div>
      )}
    </div>
  )
}
