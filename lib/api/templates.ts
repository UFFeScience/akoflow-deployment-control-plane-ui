import { request } from "./client"
import type { Template, TemplateVersion, TemplateDefinition, TerraformModule, TerraformProviderType } from "./types"

export const templatesApi = {
  list: () => request<Template[]>("/environment-templates"),
  get: (id: string) => request<Template>(`/environment-templates/${id}`),
  create: (data: Partial<Template>) =>
    request<Template>("/environment-templates", { method: "POST", body: data }),

  listVersions: (id: string) =>
    request<TemplateVersion[]>(`/environment-templates/${id}/versions`),
  getVersion: (id: string, versionId: string) =>
    request<TemplateVersion>(`/environment-templates/${id}/versions/${versionId}`),
  getVersionById: (versionId: string) =>
    request<TemplateVersion>(`/environment-template-versions/${versionId}`),
  getActiveVersion: (id: string) =>
    request<TemplateVersion>(`/environment-templates/${id}/versions/active`),
  getDefinition: (id: string) =>
    request<TemplateDefinition>(`/environment-templates/${id}/versions/active`),
  createVersion: (id: string, data: Partial<TemplateVersion>) =>
    request<TemplateVersion>(`/environment-templates/${id}/versions`, { method: "POST", body: data }),
  activateVersion: (id: string, versionId: string) =>
    request<TemplateVersion>(`/environment-templates/${id}/versions/${versionId}/activate`, {
      method: "PATCH",
    }),

  listTerraformModules: (id: string, versionId: string) =>
    request<TerraformModule[]>(`/environment-templates/${id}/versions/${versionId}/terraform-modules`),
  getTerraformModule: (id: string, versionId: string, providerType: TerraformProviderType) =>
    request<TerraformModule>(`/environment-templates/${id}/versions/${versionId}/terraform-modules/${providerType}`),
  upsertTerraformModule: (id: string, versionId: string, providerType: TerraformProviderType, data: Omit<Partial<TerraformModule>, "provider_type">) =>
    request<TerraformModule>(`/environment-templates/${id}/versions/${versionId}/terraform-modules/${providerType}`, {
      method: "PUT",
      body: data,
    }),
}

