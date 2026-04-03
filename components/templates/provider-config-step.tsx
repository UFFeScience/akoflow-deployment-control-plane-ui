"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { TemplateDefinition } from "@/lib/api/types"
import {
  PROVIDER_TYPES,
  defaultProviderConfigDraft,
  defaultTerraformDraft,
  defaultAnsibleDraft,
  type ProviderConfigDraft,
} from "./provider-config-step/types"
import { TerraformDraftEditor } from "./provider-config-step/terraform-draft-editor"
import { AnsibleDraftEditor } from "./provider-config-step/ansible-draft-editor"

// Re-export everything so existing imports keep working
export type { TerraformConfigDraft, AnsibleConfigDraft, ProviderConfigDraft } from "./provider-config-step/types"
export {
  PROVIDER_TYPES,
  defaultTerraformDraft,
  defaultAnsibleDraft,
  defaultProviderConfigDraft,
  providerConfigIsConfigured,
  providerConfigDraftToPayload,
  providerConfigFromApi,
} from "./provider-config-step/types"

interface Props {
  definition?: TemplateDefinition | null
  value: ProviderConfigDraft[]
  onChange: (v: ProviderConfigDraft[]) => void
}

export function ProviderConfigStep({ definition, value, onChange }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const current = value[selectedIndex] ?? defaultProviderConfigDraft()

  const patch = (partial: Partial<ProviderConfigDraft>) => {
    const updated = [...value]
    updated[selectedIndex] = { ...current, ...partial }
    onChange(updated)
  }

  const addConfig = () => {
    const draft = defaultProviderConfigDraft()
    draft.name = `Config ${value.length + 1}`
    onChange([...value, draft])
    setSelectedIndex(value.length)
  }

  const removeConfig = (index: number) => {
    if (value.length <= 1) return
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
    setSelectedIndex(Math.max(0, index <= selectedIndex ? selectedIndex - 1 : selectedIndex))
  }

  const expFields = definition?.environment_configuration?.sections?.flatMap((s) =>
    s.fields.map((f) => ({ name: f.name, label: f.label }))
  ) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-0 rounded-lg border border-border overflow-hidden text-xs">
          {value.map((cfg, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors border-r border-border last:border-r-0",
                selectedIndex === i ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50",
              )}
            >
              <button type="button" onClick={() => setSelectedIndex(i)}>
                {cfg.name || `Config ${i + 1}`}
              </button>
              {cfg.applies_to_providers.length > 0 ? (
                <span className={cn("text-[10px] tabular-nums opacity-70", selectedIndex === i ? "text-primary-foreground" : "")}>
                  ({cfg.applies_to_providers.join(", ")})
                </span>
              ) : (
                <span className={cn("text-[10px] opacity-50", selectedIndex === i ? "text-primary-foreground" : "")}>default</span>
              )}
              {value.length > 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); removeConfig(i) }}
                  className={cn("rounded-full hover:opacity-80", selectedIndex === i ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addConfig}>
          <Plus className="h-3 w-3" />Add configuration
        </Button>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-start">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Name</Label>
          <Input className="h-8 text-xs w-48" value={current.name}
            onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Default, AWS Production..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Applies to providers</Label>
          <p className="text-[11px] text-muted-foreground">Leave empty to use as default fallback.</p>
          <div className="flex items-center gap-1 flex-wrap">
            {PROVIDER_TYPES.map((p) => (
              <button key={p.value} type="button"
                onClick={() => {
                  const cur = current.applies_to_providers
                  patch({ applies_to_providers: cur.includes(p.value) ? cur.filter((v) => v !== p.value) : [...cur, p.value] })
                }}
                className={cn(
                  "rounded border px-2 py-0.5 text-xs font-medium transition-colors",
                  current.applies_to_providers.includes(p.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <TerraformDraftEditor
        value={current.terraform ?? defaultTerraformDraft()}
        onChange={(tf) => patch({ terraform: tf })}
        enabled={current.terraform !== null}
        onToggle={(enabled) => patch({ terraform: enabled ? defaultTerraformDraft() : null })}
        expFields={expFields}
      />

      <Separator />

      <AnsibleDraftEditor
        value={current.ansible ?? defaultAnsibleDraft()}
        onChange={(ans) => patch({ ansible: ans })}
        enabled={current.ansible !== null}
        onToggle={(enabled) => patch({ ansible: enabled ? defaultAnsibleDraft() : null })}
        expFields={expFields}
      />
    </div>
  )
}
