"use client"

import { cn } from "@/lib/utils"

export const PROVIDER_TYPES = [
  { value: "AWS",     label: "AWS" },
  { value: "GCP",     label: "GCP" },
  { value: "AZURE",   label: "Azure" },
  { value: "HPC",     label: "HPC" },
  { value: "ON_PREM", label: "On-Prem" },
  { value: "CUSTOM",  label: "Custom" },
]

export const HCL_TABS = [
  { id: "main",      label: "main.tf",      key: "main_tf" as const },
  { id: "variables", label: "variables.tf", key: "variables_tf" as const },
  { id: "outputs",   label: "outputs.tf",   key: "outputs_tf" as const },
]

export interface TerraformForm {
  main_tf: string
  variables_tf: string
  outputs_tf: string
  credential_env_keys: string[]
  tfvars_mapping_json: string
  outputs_mapping_json: string
}

export interface AnsibleForm {
  playbook_yaml: string
  inventory_template: string
  credential_env_keys: string[]
  vars_mapping_json: string
  outputs_mapping_json: string
  roles_json: string
}

export function defaultTfForm(mod?: any): TerraformForm {
  return {
    main_tf:              mod?.main_tf ?? "",
    variables_tf:         mod?.variables_tf ?? "",
    outputs_tf:           mod?.outputs_tf ?? "",
    credential_env_keys:  mod?.credential_env_keys ?? [],
    tfvars_mapping_json:  mod?.tfvars_mapping_json
      ? JSON.stringify(mod.tfvars_mapping_json, null, 2)
      : JSON.stringify({ environment_configuration: {} }, null, 2),
    outputs_mapping_json: mod?.outputs_mapping_json
      ? JSON.stringify(mod.outputs_mapping_json, null, 2)
      : JSON.stringify({ resources: [] }, null, 2),
  }
}

export function defaultAnsibleForm(pb?: any): AnsibleForm {
  return {
    playbook_yaml:        pb?.playbook_yaml ?? "",
    inventory_template:   pb?.inventory_template ?? "",
    credential_env_keys:  pb?.credential_env_keys ?? [],
    vars_mapping_json:    pb?.vars_mapping_json
      ? JSON.stringify(pb.vars_mapping_json, null, 2)
      : JSON.stringify({ environment_configuration: {} }, null, 2),
    outputs_mapping_json: pb?.outputs_mapping_json
      ? JSON.stringify(pb.outputs_mapping_json, null, 2)
      : JSON.stringify({ resources: [] }, null, 2),
    roles_json: pb?.roles_json ? JSON.stringify(pb.roles_json, null, 2) : "[]",
  }
}

interface ProviderMultiSelectProps {
  value: string[]
  onChange: (v: string[]) => void
}

export function ProviderMultiSelect({ value, onChange }: ProviderMultiSelectProps) {
  const toggle = (pt: string) =>
    onChange(value.includes(pt) ? value.filter((v) => v !== pt) : [...value, pt])

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[11px] text-muted-foreground mr-0.5">Applies to:</span>
      {PROVIDER_TYPES.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => toggle(p.value)}
          className={cn(
            "rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
            value.includes(p.value)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-foreground/30",
          )}
        >
          {p.label}
        </button>
      ))}
      {value.length === 0 && <span className="text-[10px] text-muted-foreground italic">all (default)</span>}
    </div>
  )
}
