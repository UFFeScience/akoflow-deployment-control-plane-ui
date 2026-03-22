import { request } from "./client"
import type { Instance, LogEntry } from "./types"

export const instancesApi = {
  listByDeployment: (deploymentId: string) => request<Instance[]>(`/deployments/${deploymentId}/instances`),
  get: (instanceId: string) => request<Instance>(`/instances/${instanceId}`),
  logs: (instanceId: string) => request<LogEntry[]>(`/instances/${instanceId}/logs`),
}
