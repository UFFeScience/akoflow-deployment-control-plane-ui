import { request } from "./client"
import type { Template, TemplateVersion, TemplateDefinition, TerraformModule, TerraformProviderType, AnsiblePlaybook, ProviderConfiguration, Runbook, Playbook, PlaybookTrigger } from "./types"

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

  // Provider configurations
  listProviderConfigurations: (id: string, versionId: string) =>
    request<ProviderConfiguration[]>(`/environment-templates/${id}/versions/${versionId}/provider-configurations`),
  getProviderConfiguration: (id: string, versionId: string, configId: string) =>
    request<ProviderConfiguration>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}`),
  createProviderConfiguration: (id: string, versionId: string, data: { name: string; applies_to_providers: string[] }) =>
    request<ProviderConfiguration>(`/environment-templates/${id}/versions/${versionId}/provider-configurations`, {
      method: "POST",
      body: data,
    }),
  updateProviderConfiguration: (id: string, versionId: string, configId: string, data: { name: string; applies_to_providers: string[] }) =>
    request<ProviderConfiguration>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}`, {
      method: "PUT",
      body: data,
    }),
  deleteProviderConfiguration: (id: string, versionId: string, configId: string) =>
    request<void>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}`, {
      method: "DELETE",
    }),
  upsertProviderConfigTerraform: (id: string, versionId: string, configId: string, data: Record<string, unknown>) =>
    request<ProviderConfiguration>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/terraform`, {
      method: "PUT",
      body: data,
    }),
  upsertProviderConfigAnsible: (id: string, versionId: string, configId: string, data: Record<string, unknown>, phase = "provision") =>
    request<ProviderConfiguration>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/ansible`, {
      method: "PUT",
      body: { ...data, phase },
    }),

  // Legacy endpoints kept for compatibility
  listTerraformModules: (id: string, versionId: string) =>
    request<TerraformModule[]>(`/environment-templates/${id}/versions/${versionId}/terraform-modules`),
  getTerraformModule: (id: string, versionId: string, providerType: TerraformProviderType) =>
    request<TerraformModule>(`/environment-templates/${id}/versions/${versionId}/terraform-modules/${providerType}`),
  upsertTerraformModule: (id: string, versionId: string, providerType: TerraformProviderType, data: Omit<Partial<TerraformModule>, "provider_type">) =>
    request<TerraformModule>(`/environment-templates/${id}/versions/${versionId}/terraform-modules/${providerType}`, {
      method: "PUT",
      body: data,
    }),

  listAnsiblePlaybooks: (id: string, versionId: string) =>
    request<AnsiblePlaybook[]>(`/environment-templates/${id}/versions/${versionId}/ansible-playbooks`),
  getAnsiblePlaybook: (id: string, versionId: string, providerType: string) =>
    request<AnsiblePlaybook>(`/environment-templates/${id}/versions/${versionId}/ansible-playbooks/${providerType}`),
  upsertAnsiblePlaybook: (id: string, versionId: string, providerType: string, data: Omit<Partial<AnsiblePlaybook>, "provider_type">) =>
    request<AnsiblePlaybook>(`/environment-templates/${id}/versions/${versionId}/ansible-playbooks/${providerType}`, {
      method: "PUT",
      body: data,
    }),

  // Runbooks
  listRunbooks: (id: string, versionId: string, configId: string) =>
    request<Runbook[]>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks`),
  createRunbook: (id: string, versionId: string, configId: string, data: Partial<Runbook> & { trigger?: PlaybookTrigger }) =>
    request<Runbook>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks`, {
      method: "POST",
      body: data,
    }),
  updateRunbook: (id: string, versionId: string, configId: string, runbookId: string, data: Partial<Runbook> & { trigger?: PlaybookTrigger }) =>
    request<Runbook>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${runbookId}`, {
      method: "PUT",
      body: data,
    }),
  deleteRunbook: (id: string, versionId: string, configId: string, runbookId: string) =>
    request<void>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${runbookId}`, {
      method: "DELETE",
    }),
  syncRunbookTasks: (id: string, versionId: string, configId: string, runbookId: string, tasks: unknown[]) =>
    request<unknown>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${runbookId}/tasks`, {
      method: "PUT",
      body: { tasks },
    }),
  syncProviderPlaybookTasks: (id: string, versionId: string, configId: string, tasks: unknown[]) =>
    request<unknown>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/ansible/tasks`, {
      method: "PUT",
      body: { tasks },
    }),

  // Playbooks — unified trigger-based playbooks
  listPlaybooks: (id: string, versionId: string, configId: string) =>
    request<Playbook[]>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks`),
  listActivities: (id: string, versionId: string, configId: string) =>
    request<Playbook[]>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks`),
  createPlaybook: (id: string, versionId: string, configId: string, data: Partial<Playbook>) =>
    request<Playbook>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks`, {
      method: "POST",
      body: data,
    }),
  createActivity: (id: string, versionId: string, configId: string, data: Partial<Playbook>) =>
    request<Playbook>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks`, {
      method: "POST",
      body: data,
    }),
  updatePlaybook: (id: string, versionId: string, configId: string, playbookId: string, data: Partial<Playbook>) =>
    request<Playbook>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${playbookId}`, {
      method: "PUT",
      body: data,
    }),
  updateActivity: (id: string, versionId: string, configId: string, activityId: string, data: Partial<Playbook>) =>
    request<Playbook>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${activityId}`, {
      method: "PUT",
      body: data,
    }),
  deletePlaybook: (id: string, versionId: string, configId: string, playbookId: string) =>
    request<void>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${playbookId}`, {
      method: "DELETE",
    }),
  deleteActivity: (id: string, versionId: string, configId: string, activityId: string) =>
    request<void>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${activityId}`, {
      method: "DELETE",
    }),
  syncPlaybookTasks: (id: string, versionId: string, configId: string, playbookId: string, tasks: unknown[]) =>
    request<unknown>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${playbookId}/tasks`, {
      method: "PUT",
      body: { tasks },
    }),
  syncActivityTasks: (id: string, versionId: string, configId: string, activityId: string, tasks: unknown[]) =>
    request<unknown>(`/environment-templates/${id}/versions/${versionId}/provider-configurations/${configId}/playbooks/${activityId}/tasks`, {
      method: "PUT",
      body: { tasks },
    }),
}

