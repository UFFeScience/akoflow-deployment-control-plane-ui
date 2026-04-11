import { request } from "./client"
import type { AnsibleRun, Environment, PlaybookRun, RunbookRun, TerraformRun } from "./types"

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

  // ── Phase run history ──────────────────────────────────────────────────────
  listTerraformRuns: (projectId: string, environmentId: string) =>
    request<TerraformRun[]>(`/projects/${projectId}/environments/${environmentId}/terraform-runs`),

  listAnsibleRuns: (projectId: string, environmentId: string) =>
    request<AnsibleRun[]>(`/projects/${projectId}/environments/${environmentId}/ansible-runs`),

  // ── Retry actions ──────────────────────────────────────────────────────────
  retryProvision: (projectId: string, environmentId: string, deploymentId?: string) =>
    request<{ message: string }>(`/projects/${projectId}/environments/${environmentId}/terraform-runs`, {
      method: "POST",
      body: deploymentId ? { deployment_id: deploymentId } : {},
    }),

  retryConfigure: (projectId: string, environmentId: string, deploymentId?: string) =>
    request<{ message: string }>(`/projects/${projectId}/environments/${environmentId}/ansible-runs`, {
      method: "POST",
      body: deploymentId ? { deployment_id: deploymentId } : {},
    }),

  // ── Runbook runs ───────────────────────────────────────────────────────────
  listRunbookRuns: (projectId: string, environmentId: string) =>
    request<RunbookRun[]>(`/projects/${projectId}/environments/${environmentId}/playbook-runs`),

  triggerRunbookRun: (projectId: string, environmentId: string, runbookId: string, deploymentId?: string) =>
    request<RunbookRun>(
      `/projects/${projectId}/environments/${environmentId}/playbook-runs`,
      { method: "POST", body: { playbook_id: runbookId, ...(deploymentId ? { deployment_id: deploymentId } : {}) } },
    ),

  // ── Playbook runs ───────────────────────────────────────────────────────────
  listPlaybookRuns: (projectId: string, environmentId: string) =>
    request<PlaybookRun[]>(`/projects/${projectId}/environments/${environmentId}/playbook-runs`),

  listActivityRuns: (projectId: string, environmentId: string) =>
    request<PlaybookRun[]>(`/projects/${projectId}/environments/${environmentId}/playbook-runs`),

  triggerPlaybookRun: (projectId: string, environmentId: string, playbookId: string, deploymentId?: string) =>
    request<PlaybookRun>(
      `/projects/${projectId}/environments/${environmentId}/playbook-runs`,
      { method: "POST", body: { playbook_id: playbookId, ...(deploymentId ? { deployment_id: deploymentId } : {}) } },
    ),

  triggerActivityRun: (projectId: string, environmentId: string, activityId: string, deploymentId?: string) =>
    request<PlaybookRun>(
      `/projects/${projectId}/environments/${environmentId}/playbook-runs`,
      { method: "POST", body: { playbook_id: activityId, ...(deploymentId ? { deployment_id: deploymentId } : {}) } },
    ),
}
