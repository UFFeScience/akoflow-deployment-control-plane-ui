import { parseOutputsMappingJson } from "../outputs-mapping-editor"

export const ANSIBLE_PROVIDER_TYPES: { value: string; label: string }[] = [
  { value: "hpc",     label: "HPC" },
  { value: "on_prem", label: "On-Prem" },
  { value: "aws",     label: "AWS" },
  { value: "gcp",     label: "GCP" },
  { value: "azure",   label: "Azure" },
  { value: "custom",  label: "Custom" },
]

export const INVENTORY_PROVIDERS = new Set(["hpc", "on_prem"])

export interface AnsibleDraft {
  provider_type: string
  playbook_yaml: string
  inventory_template: string
  credential_env_keys: string[]
  vars_mapping_json: string
  outputs_mapping_json: string
  roles_json: string
}

export function defaultAnsibleDraft(): AnsibleDraft {
  return {
    provider_type: "hpc",
    playbook_yaml: "",
    inventory_template: "",
    credential_env_keys: [],
    vars_mapping_json: JSON.stringify({ environment_configuration: {} }, null, 2),
    outputs_mapping_json: JSON.stringify({ resources: [] }, null, 2),
    roles_json: JSON.stringify([], null, 2),
  }
}

export function ansibleDraftToPayload(draft: AnsibleDraft): Record<string, unknown> {
  let parsedVarsMapping: unknown = null
  try { parsedVarsMapping = JSON.parse(draft.vars_mapping_json) } catch { /* ignore */ }
  let parsedOutputsMapping: unknown = null
  try { parsedOutputsMapping = parseOutputsMappingJson(draft.outputs_mapping_json) ?? null } catch { /* ignore */ }
  let parsedRoles: unknown = null
  try { parsedRoles = JSON.parse(draft.roles_json) } catch { /* ignore */ }

  return {
    provider_type: draft.provider_type || undefined,
    playbook_yaml: draft.playbook_yaml || undefined,
    inventory_template: draft.inventory_template || undefined,
    credential_env_keys: draft.credential_env_keys.filter(Boolean),
    vars_mapping_json: parsedVarsMapping ?? undefined,
    outputs_mapping_json: parsedOutputsMapping ?? undefined,
    roles_json: parsedRoles ?? undefined,
  }
}

export function ansibleDraftIsConfigured(draft: AnsibleDraft): boolean {
  return !!draft.playbook_yaml.trim()
}

export interface VarsMappingState {
  environment_configuration: Record<string, string>
}

function toStringRecord(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {}
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, typeof v === "string" ? v : ""])
  )
}

export function parseVarsMappingJson(raw: string): VarsMappingState | null {
  try {
    const parsed = JSON.parse(raw)
    return { environment_configuration: toStringRecord(parsed.environment_configuration) }
  } catch { return null }
}

export function varsMappingToJson(m: VarsMappingState): string {
  return JSON.stringify(m, null, 2)
}

export function parseRoles(raw: string): Array<string | { name: string; version?: string }> {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
