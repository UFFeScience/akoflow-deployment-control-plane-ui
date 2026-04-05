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

export interface AnsibleConfigDraft {
  playbook_yaml: string
  inventory_template: string
  credential_env_keys: string[]
  vars_mapping_json: string
  outputs_mapping_json: string
  roles_json: string
}

export interface ProviderConfigDraft {
  name: string
  applies_to_providers: string[]
  terraform: TerraformConfigDraft | null
  ansible: AnsibleConfigDraft | null
  ansible_teardown: AnsibleConfigDraft | null
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

export function defaultAnsibleDraft(): AnsibleConfigDraft {
  return {
    playbook_yaml: "",
    inventory_template: "",
    credential_env_keys: [],
    vars_mapping_json: JSON.stringify({ environment_configuration: {} }, null, 2),
    outputs_mapping_json: JSON.stringify({ resources: [] }, null, 2),
    roles_json: "[]",
  }
}

export function defaultProviderConfigDraft(): ProviderConfigDraft {
  return { name: "Default", applies_to_providers: [], terraform: defaultTerraformDraft(), ansible: null, ansible_teardown: null }
}

export function providerConfigIsConfigured(draft: ProviderConfigDraft): boolean {
  return !!(draft.terraform?.main_tf.trim() || draft.ansible?.playbook_yaml.trim())
}

export function providerConfigDraftToPayload(draft: ProviderConfigDraft) {
  return {
    name: draft.name,
    applies_to_providers: draft.applies_to_providers,
    terraform: draft.terraform ? buildTfPayload(draft.terraform) : null,
    ansible: draft.ansible ? buildAnsPayload(draft.ansible) : null,
    ansible_teardown: draft.ansible_teardown ? buildAnsPayload(draft.ansible_teardown) : null,
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
    ansible: cfg.ansible_playbook ? {
      playbook_yaml:        cfg.ansible_playbook.playbook_yaml ?? "",
      inventory_template:   cfg.ansible_playbook.inventory_template ?? "",
      credential_env_keys:  cfg.ansible_playbook.credential_env_keys ?? [],
      vars_mapping_json:    cfg.ansible_playbook.vars_mapping_json
        ? JSON.stringify(cfg.ansible_playbook.vars_mapping_json, null, 2)
        : JSON.stringify({ environment_configuration: {} }, null, 2),
      outputs_mapping_json: cfg.ansible_playbook.outputs_mapping_json
        ? JSON.stringify(cfg.ansible_playbook.outputs_mapping_json, null, 2)
        : JSON.stringify({ resources: [] }, null, 2),
      roles_json: cfg.ansible_playbook.roles_json ? JSON.stringify(cfg.ansible_playbook.roles_json, null, 2) : "[]",
    } : null,
    ansible_teardown: cfg.teardown_playbook ? {
      playbook_yaml:        cfg.teardown_playbook.playbook_yaml ?? "",
      inventory_template:   cfg.teardown_playbook.inventory_template ?? "",
      credential_env_keys:  cfg.teardown_playbook.credential_env_keys ?? [],
      vars_mapping_json:    cfg.teardown_playbook.vars_mapping_json
        ? JSON.stringify(cfg.teardown_playbook.vars_mapping_json, null, 2)
        : JSON.stringify({ environment_configuration: {} }, null, 2),
      outputs_mapping_json: cfg.teardown_playbook.outputs_mapping_json
        ? JSON.stringify(cfg.teardown_playbook.outputs_mapping_json, null, 2)
        : JSON.stringify({ resources: [] }, null, 2),
      roles_json: cfg.teardown_playbook.roles_json ? JSON.stringify(cfg.teardown_playbook.roles_json, null, 2) : "[]",
    } : null,
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

function buildAnsPayload(ans: AnsibleConfigDraft) {
  let vars: unknown = null
  try { vars = JSON.parse(ans.vars_mapping_json) } catch { /* ignore */ }
  let outputs: unknown = null
  try { outputs = parseOutputsMappingJson(ans.outputs_mapping_json) } catch { /* ignore */ }
  let roles: unknown = null
  try { roles = JSON.parse(ans.roles_json) } catch { /* ignore */ }
  return {
    playbook_yaml: ans.playbook_yaml || undefined,
    inventory_template: ans.inventory_template || undefined,
    credential_env_keys: ans.credential_env_keys.filter(Boolean),
    vars_mapping_json: vars ?? undefined,
    outputs_mapping_json: outputs ?? undefined,
    roles_json: roles ?? undefined,
  }
}
