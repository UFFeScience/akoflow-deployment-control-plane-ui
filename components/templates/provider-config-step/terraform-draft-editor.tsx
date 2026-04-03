"use client"

import { useState } from "react"
import { Code2, ChevronDown, ChevronRight } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { OutputsMappingEditor } from "../outputs-mapping-editor"
import { MappingEditor } from "./mapping-editor"
import { CredentialKeysEditor } from "./credential-keys-editor"
import { HCL_TABS, type TerraformConfigDraft } from "./types"

interface TerraformDraftEditorProps {
  value: TerraformConfigDraft
  onChange: (v: TerraformConfigDraft) => void
  enabled: boolean
  onToggle: (enabled: boolean) => void
  expFields: { name: string; label: string }[]
}

export function TerraformDraftEditor({ value, onChange, enabled, onToggle, expFields }: TerraformDraftEditorProps) {
  const [hclTab, setHclTab] = useState<"main" | "variables" | "outputs">("main")
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold">Terraform (HCL)</h3>
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
          <div className="flex flex-col gap-0">
            <div className="flex gap-0 rounded-t-lg border border-border overflow-hidden text-xs">
              {HCL_TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => setHclTab(t.id as "main" | "variables" | "outputs")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors font-mono border-r border-border last:border-r-0",
                    hclTab === t.id ? "bg-muted/70 text-foreground border-b-2 border-primary" : "bg-background text-muted-foreground hover:bg-muted/30",
                  )}
                >
                  {t.label}
                  {!!value[t.key].trim() && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                </button>
              ))}
            </div>
            {HCL_TABS.map((t) => (
              <div key={t.id} className={hclTab === t.id ? "block" : "hidden"}>
                <Textarea value={value[t.key]} onChange={(e) => onChange({ ...value, [t.key]: e.target.value })}
                  className="font-mono text-xs leading-relaxed rounded-t-none border-t-0 min-h-[200px] resize-y bg-muted/20"
                  spellCheck={false} placeholder={`# ${t.label}`} />
              </div>
            ))}
          </div>

          <MappingEditor label="Variables Mapping" placeholder="tf_var_name"
            jsonValue={value.tfvars_mapping_json} onJsonChange={(raw) => onChange({ ...value, tfvars_mapping_json: raw })}
            expFields={expFields} section="environment_configuration" />

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Outputs Mapping</Label>
            <OutputsMappingEditor value={value.outputs_mapping_json} onChange={(raw) => onChange({ ...value, outputs_mapping_json: raw })} />
          </div>

          <CredentialKeysEditor value={value.credential_env_keys} onChange={(keys) => onChange({ ...value, credential_env_keys: keys })} placeholder="AWS_ACCESS_KEY_ID" />
        </div>
      )}
    </div>
  )
}
