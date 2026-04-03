import type { FormField, FormSection, TemplateConfigGroup, TemplateDefinition } from "@/lib/api/types"

// ─── Internal working types (include id for React keys) ───────────────────────

export interface DraftField extends Omit<FormField, "type"> {
  _id: string
  type: FormField["type"] | string
}

export interface DraftGroup {
  _id: string
  name: string
  label: string
  description: string
  icon: string
}

export interface DraftSection {
  _id: string
  name: string
  label: string
  description: string
  group: string
  /** Provider slugs this section is scoped to (empty = all providers). */
  providers?: string[]
  fields: DraftField[]
}

/** A single cloud/compute provider that this template supports. */
export interface DraftProvider {
  _id: string
  /** Provider slug, e.g. "aws", "gcp", "hpc" */
  slug: string
  /** When true the provider must be used in every deployment. */
  required: boolean
}

export interface DraftDefinition {
  /** Cloud/compute providers this template supports. */
  providers: DraftProvider[]
  environment_configuration: {
    label: string
    description: string
    groups: DraftGroup[]
    sections: DraftSection[]
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function uid() {
  return Math.random().toString(36).slice(2)
}

export function emptyField(): DraftField {
  return { _id: uid(), name: "", label: "", type: "string", required: false, default: "", description: "" }
}

export function emptyGroup(): DraftGroup {
  return { _id: uid(), name: "", label: "", description: "", icon: "" }
}

export function emptySection(): DraftSection {
  return { _id: uid(), name: "", label: "", description: "", group: "", providers: [], fields: [emptyField()] }
}

export function emptyDraftDefinition(): DraftDefinition {
  return {
    providers: [],
    environment_configuration: { label: "Environment Configuration", description: "", groups: [], sections: [emptySection()] },
  }
}

/** Convert draft → clean TemplateDefinition for the API */
export function draftToDefinition(draft: DraftDefinition): TemplateDefinition {
  const cleanField = ({ _id, ...f }: DraftField): FormField => ({
    ...f as any,
    type: f.type as FormField["type"],
    options: f.options?.filter((o) => o.label || o.value),
    providers: f.providers && f.providers.length > 0 ? f.providers : undefined,
  })

  const cleanSection = ({ _id, ...s }: DraftSection): FormSection => ({
    ...s,
    group: s.group || undefined,
    providers: s.providers && s.providers.length > 0 ? s.providers : undefined,
    fields: s.fields.map(cleanField),
  })

  const cleanGroup = ({ _id, ...g }: DraftGroup) => ({
    name: g.name,
    label: g.label,
    description: g.description || undefined,
    icon: g.icon || undefined,
  })

  const expCfg = draft.environment_configuration
  const groups = expCfg.groups.filter((g) => g.name).map(cleanGroup)

  const allProviders = draft.providers.map((p) => p.slug)
  const requiredProviders = draft.providers.filter((p) => p.required).map((p) => p.slug)

  return {
    providers: allProviders.length > 0 ? allProviders : undefined,
    required_providers: requiredProviders.length > 0 ? requiredProviders : undefined,
    environment_configuration: {
      label: expCfg.label || "Environment Configuration",
      description: expCfg.description,
      type: "environment",
      groups: groups.length ? groups : undefined,
      sections: expCfg.sections.map(cleanSection),
    },
  }
}

/** Convert existing TemplateDefinition → DraftDefinition */
export function definitionToDraft(def: TemplateDefinition): DraftDefinition {
  const draftField = (f: FormField): DraftField => ({ ...f, _id: uid() })
  const draftSection = (s: FormSection): DraftSection => ({
    ...s, _id: uid(), description: s.description ?? "", group: s.group ?? "",
    providers: s.providers ? [...s.providers] : [],
    fields: (s.fields ?? []).map(draftField),
  })
  const draftGroup = (g: TemplateConfigGroup): DraftGroup => ({
    _id: uid(), name: g.name, label: g.label, description: g.description ?? "", icon: g.icon ?? "",
  })

  const requiredSet = new Set(def.required_providers ?? [])
  const providers: DraftProvider[] = (def.providers ?? []).map((slug) => ({
    _id: uid(),
    slug,
    required: requiredSet.has(slug),
  }))

  return {
    providers,
    environment_configuration: {
      label: def.environment_configuration?.label ?? "Environment Configuration",
      description: def.environment_configuration?.description ?? "",
      groups: (def.environment_configuration?.groups ?? []).map(draftGroup),
      sections: (def.environment_configuration?.sections ?? []).map(draftSection),
    },
  }
}
