"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { OutputsMappingEditor } from "../outputs-mapping-editor"
import { parseOutputsMappingJson } from "../outputs-mapping-editor"
import type { TerraformForm } from "./shared"
import { HCL_TABS } from "./shared"
import type { TemplateDefinition, ProviderConfiguration } from "@/lib/api/types"

interface TerraformSectionProps {
  config: ProviderConfiguration
  tfForm: TerraformForm
  onTfFormChange: (form: TerraformForm) => void
  expFields: { name: string; label: string }[]
  newCredKeyTf: string
  onNewCredKeyTfChange: (v: string) => void
}

export function TerraformSection({ config, tfForm, onTfFormChange, expFields, newCredKeyTf, onNewCredKeyTfChange }: TerraformSectionProps) {
  const [hclTab, setHclTab] = useState<"main" | "variables" | "outputs">("main")
  const [showTf, setShowTf] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setShowTf((v) => !v)}
      >
        {showTf ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <Code2 className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-sm font-semibold">Terraform (HCL)</span>
        {config.terraform_module?.has_custom_hcl && (
          <Badge variant="secondary" className="text-[10px] ml-1">Configured</Badge>
        )}
      </button>

      {showTf && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-0">
            <div className="flex gap-0 rounded-t-lg border border-border overflow-hidden text-xs">
              {HCL_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setHclTab(t.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors font-mono border-r border-border last:border-r-0",
                    hclTab === t.id
                      ? "bg-muted/70 text-foreground border-b-2 border-primary"
                      : "bg-background text-muted-foreground hover:bg-muted/30",
                  )}
                >
                  {t.label}
                  {!!tfForm[t.key].trim() && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                </button>
              ))}
            </div>
            {HCL_TABS.map((t) => (
              <div key={t.id} className={hclTab === t.id ? "block" : "hidden"}>
                <Textarea
                  value={tfForm[t.key]}
                  onChange={(e) => onTfFormChange({ ...tfForm, [t.key]: e.target.value })}
                  className="font-mono text-xs leading-relaxed rounded-t-none border-t-0 min-h-[200px] resize-y bg-muted/20"
                  spellCheck={false}
                  placeholder={`# ${t.label}`}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Variables Mapping</Label>
            <p className="text-[11px] text-muted-foreground">Maps definition fields → Terraform variable names.</p>
            {expFields.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr] gap-x-2 px-3 py-1.5 bg-muted/30 text-[11px] text-muted-foreground">
                  <span>definition field</span><span>tf variable</span>
                </div>
                {expFields.map((f) => {
                  let mapping: Record<string, string> = {}
                  try { mapping = JSON.parse(tfForm.tfvars_mapping_json)?.environment_configuration ?? {} } catch { /* ignore */ }
                  return (
                    <div key={f.name} className="grid grid-cols-[1fr_1fr] gap-x-2 px-3 py-1 border-t border-border/50 items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">{f.label}</span>
                        <code className="text-[10px] text-muted-foreground">{f.name}</code>
                      </div>
                      <Input
                        className="h-6 text-xs font-mono"
                        value={mapping[f.name] ?? ""}
                        placeholder="tf_var_name"
                        onChange={(e) => {
                          let m: Record<string, unknown> = {}
                          try { m = JSON.parse(tfForm.tfvars_mapping_json) } catch { /* ignore */ }
                          const ec = (m.environment_configuration as Record<string, string>) ?? {}
                          ec[f.name] = e.target.value
                          m.environment_configuration = ec
                          onTfFormChange({ ...tfForm, tfvars_mapping_json: JSON.stringify(m, null, 2) })
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <Textarea
                className="font-mono text-xs min-h-[100px] resize-y"
                value={tfForm.tfvars_mapping_json}
                onChange={(e) => onTfFormChange({ ...tfForm, tfvars_mapping_json: e.target.value })}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Outputs Mapping</Label>
            <OutputsMappingEditor
              value={tfForm.outputs_mapping_json}
              onChange={(raw) => onTfFormChange({ ...tfForm, outputs_mapping_json: raw })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Credential ENV Keys</Label>
            {tfForm.credential_env_keys.map((key, i) => (
              <div key={i} className="flex gap-2">
                <code className="flex-1 rounded border bg-muted/50 px-2 py-1 text-xs font-mono">{key}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onTfFormChange({ ...tfForm, credential_env_keys: tfForm.credential_env_keys.filter((_, j) => j !== i) })}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input className="h-7 text-xs font-mono" placeholder="AWS_ACCESS_KEY_ID"
                value={newCredKeyTf}
                onChange={(e) => onNewCredKeyTfChange(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCredKeyTf.trim()) {
                    onTfFormChange({ ...tfForm, credential_env_keys: [...tfForm.credential_env_keys, newCredKeyTf.trim()] })
                    onNewCredKeyTfChange("")
                  }
                }}
              />
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!newCredKeyTf.trim()}
                onClick={() => {
                  if (!newCredKeyTf.trim()) return
                  onTfFormChange({ ...tfForm, credential_env_keys: [...tfForm.credential_env_keys, newCredKeyTf.trim()] })
                  onNewCredKeyTfChange("")
                }}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
