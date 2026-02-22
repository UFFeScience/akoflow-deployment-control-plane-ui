import { request } from "./client"
import type { Cluster, Instance } from "./types"

export const clustersApi = {
  list: (experimentId: string) => request<Cluster[]>(`/experiments/${experimentId}/clusters`),
  create: (
    experimentId: string,
    data: { templateId?: string; providerId: string; region: string; instanceTypeId: string; role?: string; nodeCount: number }
  ) => request<Cluster>(`/experiments/${experimentId}/clusters`, { method: "POST", body: data }),
  scale: (clusterId: string, data: { nodeCount: number }) =>
    request<Cluster>(`/clusters/${clusterId}/scale`, { method: "POST", body: data }),
  destroy: (clusterId: string) => request(`/clusters/${clusterId}`, { method: "DELETE" }),
  instances: (clusterId: string) => request<Instance[]>(`/clusters/${clusterId}/instances`),
}
