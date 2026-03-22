import { request } from "./client"
import type { ProvisionedResource, ResourceLogEntry } from "./types"

export const resourcesApi = {
  listByDeployment: (deploymentId: string) =>
    request<ProvisionedResource[]>(`/deployments/${deploymentId}/resources`),

  get: (resourceId: string) =>
    request<ProvisionedResource>(`/resources/${resourceId}`),

  logs: (resourceId: string) =>
    request<ResourceLogEntry[]>(`/resources/${resourceId}/logs`),
}
