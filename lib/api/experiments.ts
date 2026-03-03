import { request } from "./client"
import type { Experiment } from "./types"

export const experimentsApi = {
  list: (projectId: string) => request<Experiment[]>(`/projects/${projectId}/experiments`),
  create: (
    projectId: string,
    data: {
      name: string
      description?: string
      status?: string
      template_id?: string
      terraform_variables?: Record<string, unknown>
      lifecycle_hooks?: Record<string, string>
      provider_id?: string
      instance_groups?: Array<{
        instance_type_id: string
        role?: string
        quantity: number
        metadata?: Record<string, unknown>
      }>
    }
  ) => request<Experiment>(`/projects/${projectId}/experiments`, { method: "POST", body: data }),
  get: (projectId: string, experimentId: string) =>
    request<Experiment>(`/projects/${projectId}/experiments/${experimentId}`),
  update: (projectId: string, experimentId: string, data: Partial<Experiment>) =>
    request<Experiment>(`/projects/${projectId}/experiments/${experimentId}`, { method: "PATCH", body: data }),
  delete: (projectId: string, experimentId: string) =>
    request(`/projects/${projectId}/experiments/${experimentId}`, { method: "DELETE" }),
}
