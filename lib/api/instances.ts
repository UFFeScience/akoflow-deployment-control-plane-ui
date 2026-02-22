import { request } from "./client"
import type { Instance } from "./types"

export const instancesApi = {
  list: (experimentId: string) => request<Instance[]>(`/experiments/${experimentId}/instances`),
  create: (experimentId: string, data: { provider: string; region: string }) =>
    request<Instance>(`/experiments/${experimentId}/instances`, { method: "POST", body: data }),
  delete: (experimentId: string, instanceId: string) =>
    request(`/experiments/${experimentId}/instances/${instanceId}`, { method: "DELETE" }),
  scale: (experimentId: string, instanceId: string, configId: string, quantity: number) =>
    request(`/experiments/${experimentId}/instances/${instanceId}/config/${configId}/scale`, {
      method: "POST",
      body: { quantity },
    }),
}
