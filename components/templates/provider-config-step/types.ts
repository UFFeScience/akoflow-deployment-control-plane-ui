import type { ProviderConfiguration } from "@/lib/api/types"
import { parseOutputsMappingJson } from "../outputs-mapping-editor"

export const PROVIDER_TYPES: { value: string; label: string }[] = [
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

export interface TerraformConfigDraft {
  main_tf: string
  variables_tf: string
  outputs_tf: string
  credential_env_keys: string[]
  tfvars_mapping_json: string
  outputs_mapping_json: string
}

export interface ProviderConfigDraft {
  name: string
  applies_to_providers: string[]
  terraform: TerraformConfigDraft | null
}

export function defaultTerraformDraft(): TerraformConfigDraft {
  return {
    main_tf: "",
    variables_tf: "",
    outputs_tf: "",
    credential_env_keys: [],
    tfvars_mapping_json: JSON.stringify({ environment_configuration: {} }, null, 2),
    outputs_mapping_json: JSON.stringify({ resources: [] }, null, 2),
  }
}

export function defaultProviderConfigDraft(): ProviderConfigDraft {
  return { name: "Default", applies_to_providers: [], terraform: defaultTerraformDraft() }
}

export function providerConfigIsConfigured(draft: ProviderConfigDraft): boolean {
  return !!draft.terraform?.main_tf.trim()
}

export function providerConfigDraftToPayload(draft: ProviderConfigDraft) {
  return {
    name: draft.name,
    applies_to_providers: draft.applies_to_providers,
    terraform: draft.terraform ? buildTfPayload(draft.terraform) : null,
  }
}

export function providerConfigFromApi(cfg: ProviderConfiguration): ProviderConfigDraft {
  return {
    name: cfg.name,
    applies_to_providers: cfg.applies_to_providers,
    terraform: cfg.terraform_module ? {
      main_tf:              cfg.terraform_module.main_tf ?? "",
      variables_tf:         cfg.terraform_module.variables_tf ?? "",
      outputs_tf:           cfg.terraform_module.outputs_tf ?? "",
      credential_env_keys:  cfg.terraform_module.credential_env_keys ?? [],
      tfvars_mapping_json:  cfg.terraform_module.tfvars_mapping_json
        ? JSON.stringify(cfg.terraform_module.tfvars_mapping_json, null, 2)
        : JSON.stringify({ environment_configuration: {} }, null, 2),
      outputs_mapping_json: cfg.terraform_module.outputs_mapping_json
        ? JSON.stringify(cfg.terraform_module.outputs_mapping_json, null, 2)
        : JSON.stringify({ resources: [] }, null, 2),
    } : defaultTerraformDraft(),
  }
}

function buildTfPayload(tf: TerraformConfigDraft) {
  let tfvars: unknown = null
  try { tfvars = JSON.parse(tf.tfvars_mapping_json) } catch { /* ignore */ }
  let outputs: unknown = null
  try { outputs = parseOutputsMappingJson(tf.outputs_mapping_json) } catch { /* ignore */ }
  return {
    main_tf: tf.main_tf || undefined,
    variables_tf: tf.variables_tf || undefined,
    outputs_tf: tf.outputs_tf || undefined,
    credential_env_keys: tf.credential_env_keys.filter(Boolean),
    tfvars_mapping_json: tfvars ?? undefined,
    outputs_mapping_json: outputs ?? undefined,
  }
}
