export const STEPS = [
  { id: 1, label: "Basic Info",       optional: false },
  { id: 2, label: "Definition",       optional: false },
  { id: 3, label: "Implementation",   optional: true,  sublabel: "Terraform" },
  { id: 4, label: "Configuration",    optional: true,  sublabel: "Ansible" },
  { id: 5, label: "Review",           optional: false },
]

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
