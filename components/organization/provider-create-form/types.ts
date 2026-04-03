import type { Provider, ProviderVariableSchema } from "@/lib/api/types"

export const PROVIDER_TYPES: { value: Provider["type"]; label: string }[] = [
  { value: "AWS",     label: "AWS" },
  { value: "GCP",     label: "GCP" },
  { value: "AZURE",   label: "Azure" },
  { value: "ON_PREM", label: "On-Premises" },
  { value: "HPC",     label: "HPC / Slurm" },
  { value: "CUSTOM",  label: "Custom" },
]

export const SLUG_SUGGESTIONS: Partial<Record<Provider["type"], string>> = {
  AWS: "aws", GCP: "gcp", AZURE: "azure", HPC: "slurm", ON_PREM: "", CUSTOM: "",
}

export const FIELD_TYPES: ProviderVariableSchema["type"][] = [
  "string", "secret", "textarea", "select", "boolean", "number",
]

export type SchemaRow = {
  key: string
  section: string
  name: string
  label: string
  description: string
  type: ProviderVariableSchema["type"]
  required: boolean
  is_sensitive: boolean
  default_value: string
  options_raw: string
}

export function emptyRow(): SchemaRow {
  return {
    key: Math.random().toString(36).slice(2),
    section: "general", name: "", label: "", description: "",
    type: "string", required: false, is_sensitive: false,
    default_value: "", options_raw: "",
  }
}
