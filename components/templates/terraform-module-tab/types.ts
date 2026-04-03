import type { TerraformModule } from "@/lib/api/types"

export const HCL_TABS = [
  { id: "main",      label: "main.tf",      key: "main_tf" as const },
  { id: "variables", label: "variables.tf", key: "variables_tf" as const },
  { id: "outputs",   label: "outputs.tf",   key: "outputs_tf" as const },
]

export interface TfForm {
  module_slug: string
  provider_type: string
  main_tf: string
  variables_tf: string
  outputs_tf: string
  credential_env_keys: string[]
  tfvars_mapping_json: string
  mapping_mode: "visual" | "raw"
  outputs_mapping_json: string
}

export interface MappingState {
  environment_configuration: Record<string, string>
}

export function toStringRecord(obj: unknown): Record<string, string> {
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

export function defaultForm(mod?: TerraformModule | null): TfForm {
  const credKeys = Array.isArray(mod?.credential_env_keys)
    ? mod?.credential_env_keys
    : mod?.credential_env_keys ? [String(mod.credential_env_keys)] : []

  return {
    module_slug: mod?.module_slug ?? "",
    provider_type: mod?.provider_type ?? "",
    main_tf: mod?.main_tf ?? "",
    variables_tf: mod?.variables_tf ?? "",
    outputs_tf: mod?.outputs_tf ?? "",
    credential_env_keys: credKeys,
    tfvars_mapping_json: mod?.tfvars_mapping_json
      ? JSON.stringify(mod.tfvars_mapping_json, null, 2)
      : JSON.stringify({ environment_configuration: {} }, null, 2),
    mapping_mode: "visual",
    outputs_mapping_json: mod?.outputs_mapping_json
      ? JSON.stringify(mod.outputs_mapping_json, null, 2)
      : JSON.stringify({ resources: [] }, null, 2),
  }
}
