import { request } from "./client"
import type { Template, TemplateVersion, TemplateDefinition, TerraformModule } from "./types"

export const templatesApi = {
  list: () => request<Template[]>("/experiment-templates"),
  get: (id: string) => request<Template>(`/experiment-templates/${id}`),
  create: (data: Partial<Template>) =>
    request<Template>("/experiment-templates", { method: "POST", body: data }),

  listVersions: (id: string) =>
    request<TemplateVersion[]>(`/experiment-templates/${id}/versions`),
  getVersion: (id: string, versionId: string) =>
    request<TemplateVersion>(`/experiment-templates/${id}/versions/${versionId}`),
  getActiveVersion: (id: string) =>
    request<TemplateVersion>(`/experiment-templates/${id}/versions/active`),
  getDefinition: (id: string) =>
    request<TemplateDefinition>(`/experiment-templates/${id}/versions/active`),
  createVersion: (id: string, data: Partial<TemplateVersion>) =>
    request<TemplateVersion>(`/experiment-templates/${id}/versions`, { method: "POST", body: data }),
  activateVersion: (id: string, versionId: string) =>
    request<TemplateVersion>(`/experiment-templates/${id}/versions/${versionId}/activate`, {
      method: "PATCH",
    }),

  getTerraformModule: (id: string, versionId: string) =>
    request<TerraformModule>(`/experiment-templates/${id}/versions/${versionId}/terraform-module`),
  upsertTerraformModule: (id: string, versionId: string, data: Partial<TerraformModule>) =>
    request<TerraformModule>(`/experiment-templates/${id}/versions/${versionId}/terraform-module`, {
      method: "PUT",
      body: data,
    }),
}

