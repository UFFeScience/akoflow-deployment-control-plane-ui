import type { AnsiblePlaybook } from "@/lib/api/types"

export interface OutputResource {
  name: string
  ansible_resource_type: string
  outputs: {
    provider_resource_id: string
    public_ip: string
    private_ip: string
    iframe_url: string
    metadata: Array<{ key: string; output_key: string }>
  }
}

export function defaultOutputResource(): OutputResource {
  return {
    name: "",
    ansible_resource_type: "",
    outputs: { provider_resource_id: "", public_ip: "", private_ip: "", iframe_url: "", metadata: [] },
  }
}

export function parseOutputsJson(raw: string): OutputResource[] {
  try {
    const parsed = JSON.parse(raw)
    return (parsed.resources ?? []).map((r: any) => ({
      name: r.name ?? "",
      ansible_resource_type: r.ansible_resource_type ?? "",
      outputs: {
        provider_resource_id: r.outputs?.provider_resource_id ?? "",
        public_ip: r.outputs?.public_ip ?? "",
        private_ip: r.outputs?.private_ip ?? "",
        iframe_url: r.outputs?.iframe_url ?? "",
        metadata: Object.entries((r.outputs?.metadata ?? {}) as Record<string, string>).map(
          ([key, output_key]) => ({ key, output_key }),
        ),
      },
    }))
  } catch { return [] }
}

export function outputsToJson(resources: OutputResource[]): string {
  return JSON.stringify({
    resources: resources.map((r) => ({
      name: r.name,
      ansible_resource_type: r.ansible_resource_type || undefined,
      outputs: {
        ...(r.outputs.provider_resource_id ? { provider_resource_id: r.outputs.provider_resource_id } : {}),
        ...(r.outputs.public_ip ? { public_ip: r.outputs.public_ip } : {}),
        ...(r.outputs.private_ip ? { private_ip: r.outputs.private_ip } : {}),
        ...(r.outputs.iframe_url ? { iframe_url: r.outputs.iframe_url } : {}),
        metadata: Object.fromEntries(
          r.outputs.metadata.filter((m) => m.key && m.output_key).map((m) => [m.key, m.output_key]),
        ),
      },
    })),
  }, null, 2)
}

export interface VarsMapping {
  environment_configuration: Record<string, string>
}

export function parseVarsJson(raw: string): VarsMapping | null {
  try {
    const parsed = JSON.parse(raw)
    return {
      environment_configuration: Object.fromEntries(
        Object.entries(parsed.environment_configuration ?? {}).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
      ),
    }
  } catch { return null }
}

export function varsMappingToJson(m: VarsMapping): string {
  return JSON.stringify(m, null, 2)
}

export interface AnsibleTabForm {
  provider_type: string
  playbook_yaml: string
  inventory_template: string
  credential_env_keys: string[]
  vars_mapping_json: string
  outputs_mapping_json: string
  roles_json: string
}

export function defaultForm(playbook?: AnsiblePlaybook | null): AnsibleTabForm {
  const credKeys = Array.isArray(playbook?.credential_env_keys) ? playbook!.credential_env_keys : []
  return {
    provider_type: playbook?.provider_type ?? "",
    playbook_yaml: playbook?.playbook_yaml ?? "",
    inventory_template: playbook?.inventory_template ?? "",
    credential_env_keys: credKeys,
    vars_mapping_json: playbook?.vars_mapping_json
      ? JSON.stringify(playbook.vars_mapping_json, null, 2)
      : JSON.stringify({ environment_configuration: {} }, null, 2),
    outputs_mapping_json: playbook?.outputs_mapping_json
      ? JSON.stringify(playbook.outputs_mapping_json, null, 2)
      : JSON.stringify({ resources: [] }, null, 2),
    roles_json: playbook?.roles_json ? JSON.stringify(playbook.roles_json, null, 2) : "[]",
  }
}

export const PROVIDER_TYPES = [
  { value: "HPC",     label: "HPC" },
  { value: "ON_PREM", label: "On-Prem" },
  { value: "AWS",     label: "AWS" },
  { value: "GCP",     label: "GCP" },
  { value: "AZURE",   label: "Azure" },
  { value: "CUSTOM",  label: "Custom" },
]
