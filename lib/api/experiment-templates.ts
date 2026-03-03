import type { TemplateDefinition } from "./types"

export interface ExperimentTemplate {
  id: string
  name: string
  slug: string
  description: string
  runtime_type: string
  is_public: boolean
  created_at: string
}

export interface ExperimentTemplateVersion {
  id: string
  template_id: string
  version: string
   schema_version?: string
  definition_json: TemplateDefinition
  is_active: boolean
  created_at: string
}

export const experimentTemplatesApi = {
  async list(): Promise<ExperimentTemplate[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/experiment-templates`)
    if (!response.ok) throw new Error("Failed to fetch experiment templates")
    return response.json()
  },

  async getActive(id: string): Promise<ExperimentTemplateVersion> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/experiment-templates/${id}/versions/active`
    )
    if (!response.ok) throw new Error("Failed to fetch active template version")
    return response.json()
  },

  async getVersion(id: string, versionId: string): Promise<ExperimentTemplateVersion> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/experiment-templates/${id}/versions/${versionId}`
    )
    if (!response.ok) throw new Error("Failed to fetch template version")
    return response.json()
  },
}
