"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight, Terminal, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { OutputsMappingEditor } from "../outputs-mapping-editor"
import type { AnsibleForm } from "./shared"
import type { ProviderConfiguration } from "@/lib/api/types"

interface AnsibleSectionProps {
  config: ProviderConfiguration
  ansibleForm: AnsibleForm
  onAnsibleFormChange: (form: AnsibleForm) => void
  expFields: { name: string; label: string }[]
  newCredKeyAns: string
  onNewCredKeyAnsChange: (v: string) => void
}

export function AnsibleSection({ config, ansibleForm, onAnsibleFormChange, expFields, newCredKeyAns, onNewCredKeyAnsChange }: AnsibleSectionProps) {
  const [showInventory, setShowInventory] = useState(false)
  const [showAnsible, setShowAnsible] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setShowAnsible((v) => !v)}
      >
        {showAnsible ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <Terminal className="h-3.5 w-3.5 text-green-500" />
        <span className="text-sm font-semibold">Ansible</span>
        {config.ansible_playbook?.has_custom_playbook && (
          <Badge variant="secondary" className="text-[10px] ml-1">Configured</Badge>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground font-normal italic">optional</span>
      </button>

      {showAnsible && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">playbook.yml</Label>
            <Textarea
              className="font-mono text-xs min-h-[180px] resize-y"
              placeholder={"- hosts: all\n  become: yes\n  tasks:\n    - name: ..."}
              value={ansibleForm.playbook_yaml}
              onChange={(e) => onAnsibleFormChange({ ...ansibleForm, playbook_yaml: e.target.value })}
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

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Credential ENV Keys</Label>
            {ansibleForm.credential_env_keys.map((key, i) => (
              <div key={i} className="flex gap-2">
                <code className="flex-1 rounded border bg-muted/50 px-2 py-1 text-xs font-mono">{key}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onAnsibleFormChange({ ...ansibleForm, credential_env_keys: ansibleForm.credential_env_keys.filter((_, j) => j !== i) })}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input className="h-7 text-xs font-mono" placeholder="SSH_PRIVATE_KEY"
                value={newCredKeyAns}
                onChange={(e) => onNewCredKeyAnsChange(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCredKeyAns.trim()) {
                    onAnsibleFormChange({ ...ansibleForm, credential_env_keys: [...ansibleForm.credential_env_keys, newCredKeyAns.trim()] })
                    onNewCredKeyAnsChange("")
                  }
                }}
              />
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!newCredKeyAns.trim()}
                onClick={() => {
                  if (!newCredKeyAns.trim()) return
                  onAnsibleFormChange({ ...ansibleForm, credential_env_keys: [...ansibleForm.credential_env_keys, newCredKeyAns.trim()] })
                  onNewCredKeyAnsChange("")
                }}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add
              </Button>
            </div>
          </div>

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
        </div>
      )}
    </div>
  )
}
