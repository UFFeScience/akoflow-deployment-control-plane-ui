import { request } from "./client"
import type { Instance, LogEntry } from "./types"

export const instancesApi = {
  listByCluster: (clusterId: string) => request<Instance[]>(`/deployments/${clusterId}/instances`),
  get: (instanceId: string) => request<Instance>(`/instances/${instanceId}`),
  logs: (instanceId: string) => request<LogEntry[]>(`/instances/${instanceId}/logs`),
}
