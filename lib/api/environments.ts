import { request } from "./client"
import type { Environment } from "./types"

export const environmentsApi = {
  listAll: (orgId: string) => request<Environment[]>(`/organizations/${orgId}/environments`),
  list: (projectId: string) => request<Environment[]>(`/projects/${projectId}/environments`),
  create: (
    projectId: string,
    data: {
      name: string
      description?: string
      status?: string
      /** ID of the EnvironmentTemplateVersion that drives the form */
      environment_template_version_id?: string
      /** Filled-in values from the template form, keyed by section */
      configuration_json?: Record<string, unknown>
      instance_groups?: Array<{
        instance_type_id: string
        role?: string
        quantity: number
        metadata?: Record<string, unknown>
      }>
    }
  ) => request<Environment>(`/projects/${projectId}/environments`, { method: "POST", body: data }),
  provision: (
    projectId: string,
    data: {
      name: string
      description?: string
      execution_mode?: "manual" | "auto" | "scheduled"
      environment_template_version_id?: string
      configuration_json?: Record<string, unknown>
      deployment?: {
        provider_credentials: Array<{ provider_id: string; credential_id?: string | null }>
        region?: string
        deployment_template_id?: string
        name?: string
      }
    }
  ) => request<Environment & { deployment?: unknown }>(`/projects/${projectId}/environments/provision`, { method: "POST", body: data }),
  get: (projectId: string, environmentId: string) =>
    request<Environment>(`/projects/${projectId}/environments/${environmentId}`),
  update: (projectId: string, environmentId: string, data: Partial<Environment>) =>
    request<Environment>(`/projects/${projectId}/environments/${environmentId}`, { method: "PATCH", body: data }),
  delete: (projectId: string, environmentId: string) =>
    request(`/projects/${projectId}/environments/${environmentId}`, { method: "DELETE" }),
  terraformDestroy: (projectId: string, environmentId: string) =>
    request(`/projects/${projectId}/environments/${environmentId}/terraform-runs/destroy`, { method: "POST" }),
}
