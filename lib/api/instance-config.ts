import { request } from "./client"
import type { InstanceConfig } from "./types"

export const configApi = {
  create: (instanceId: string, data: Partial<InstanceConfig>) =>
    request<InstanceConfig>(`/instances/${instanceId}/config`, { method: "POST", body: data }),
  update: (instanceId: string, configId: string, data: Partial<InstanceConfig>) =>
    request<InstanceConfig>(`/instances/${instanceId}/config/${configId}`, { method: "PATCH", body: data }),
  delete: (instanceId: string, configId: string) =>
    request(`/instances/${instanceId}/config/${configId}`, { method: "DELETE" }),
}
