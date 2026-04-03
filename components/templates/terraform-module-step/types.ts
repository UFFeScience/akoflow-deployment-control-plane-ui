import type { TerraformProviderType } from "@/lib/api/types"
import { parseOutputsMappingJson } from "../outputs-mapping-editor"

export const PROVIDER_TYPES: { value: TerraformProviderType; label: string }[] = [
  { value: "aws",    label: "AWS" },
  { value: "gcp",    label: "GCP" },
  { value: "azure",  label: "Azure" },
  { value: "custom", label: "Custom" },
]

export const HCL_TABS = [
  { id: "main",      label: "main.tf",      key: "main_tf" as const },
  { id: "variables", label: "variables.tf", key: "variables_tf" as const },
  { id: "outputs",   label: "outputs.tf",   key: "outputs_tf" as const },
]

export interface TfDraft {
  provider_type: TerraformProviderType | string
  main_tf: string
  variables_tf: string
  outputs_tf: string
  credential_env_keys: string[]
  tfvars_mapping_json: string
  outputs_mapping_json: string
}

export interface MappingState {
  environment_configuration: Record<string, string>
}

function toStringRecord(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {}
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, typeof v === "string" ? v : ""])
  )
}

export function parseMappingJson(raw: string): MappingState | null {
  try {
    const parsed = JSON.parse(raw)
    return { environment_configuration: toStringRecord(parsed.environment_configuration) }
  } catch { return null }
}

export function mappingToJson(m: MappingState): string {
  return JSON.stringify(m, null, 2)
}

export function defaultTfDraft(): TfDraft {
  return {
    provider_type: "aws",
    main_tf: "",
    variables_tf: "",
    outputs_tf: "",
    credential_env_keys: [],
    tfvars_mapping_json: JSON.stringify({ environment_configuration: {} }, null, 2),
    outputs_mapping_json: JSON.stringify({ resources: [] }, null, 2),
  }
}

export function tfDraftToPayload(draft: TfDraft): Record<string, unknown> {
  let parsedMapping: unknown = null
  try { parsedMapping = JSON.parse(draft.tfvars_mapping_json) } catch { /* ignore */ }
  let parsedOutputsMapping: unknown = null
  try { parsedOutputsMapping = parseOutputsMappingJson(draft.outputs_mapping_json) ?? null } catch { /* ignore */ }
  return {
    provider_type: draft.provider_type || undefined,
    credential_env_keys: draft.credential_env_keys.filter(Boolean),
    tfvars_mapping_json: parsedMapping ?? undefined,
    outputs_mapping_json: parsedOutputsMapping ?? undefined,
    main_tf: draft.main_tf || undefined,
    variables_tf: draft.variables_tf || undefined,
    outputs_tf: draft.outputs_tf || undefined,
  }
}

export function tfDraftIsConfigured(draft: TfDraft): boolean {
  return !!draft.main_tf.trim()
}
