import { request } from "./client"
import type { Project } from "./types"

export const projectsApi = {
  list: (orgId: string) => request<Project[]>(`/organizations/${orgId}/projects`),
  create: (orgId: string, data: { name: string; description?: string }) =>
    request<Project>(`/organizations/${orgId}/projects`, { method: "POST", body: data }),
  get: (orgId: string, projectId: string) =>
    request<Project>(`/organizations/${orgId}/projects/${projectId}`),
  update: (orgId: string, projectId: string, data: Partial<Project>) =>
    request<Project>(`/organizations/${orgId}/projects/${projectId}`, { method: "PATCH", body: data }),
  delete: (orgId: string, projectId: string) =>
    request(`/organizations/${orgId}/projects/${projectId}`, { method: "DELETE" }),
}
