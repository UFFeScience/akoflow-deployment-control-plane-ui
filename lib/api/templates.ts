import { request } from "./client"
import type { Template, TemplateVersion, TemplateDefinition } from "./types"

export const templatesApi = {
  list: () => request<Template[]>("/experiment-templates"),
  create: (data: Partial<Template>) =>
    request<Template>("/experiment-templates", { method: "POST", body: data }),
  get: (id: string) => request<Template>(`/experiment-templates/${id}`),
  getActiveVersion: (id: string) => request<TemplateVersion>(`/experiment-templates/${id}/versions/active`),
  getVersion: (id: string, versionId: string) => request<TemplateVersion>(`/experiment-templates/${id}/versions/${versionId}`),
  getDefinition: (id: string) => request<TemplateDefinition>(`/experiment-templates/${id}/versions/active`),
  createVersion: (id: string, data: Partial<TemplateVersion>) =>
    request<Template>(`/experiment-templates/${id}/versions`, { method: "POST", body: data }),
}
