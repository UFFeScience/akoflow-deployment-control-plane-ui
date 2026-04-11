export const STEPS = [
  { id: 1, label: "Basic Info",            optional: false },
  { id: 2, label: "Definition",            optional: false },
  { id: 3, label: "Provision",             optional: true,  sublabel: "Terraform" },
  { id: 4, label: "Configuration",         optional: true,  sublabel: "Playbooks + Runbooks" },
  { id: 5, label: "Review",                optional: false },
]

export interface RunbookDraft {
  _id: string
  name: string
  description: string
  trigger: import("@/lib/api/types").PlaybookTrigger
  playbook_yaml: string
  credential_env_keys: string[]
  roles_json: string
}

export function defaultRunbookDraft(): RunbookDraft {
  return {
    _id: Math.random().toString(36).slice(2),
    name: "",
    description: "",
    trigger: "manual",
    playbook_yaml: "",
    credential_env_keys: [],
    roles_json: "[]",
  }
}

export interface BasicInfo {
  name: string
  slug: string
  description: string
  is_public: boolean
  first_version: string
}

export function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
