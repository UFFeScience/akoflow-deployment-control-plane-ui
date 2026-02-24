import { request } from "./client"
import type { Cluster, Instance } from "./types"

export const clustersApi = {
  list: (experimentId: string) => request<Cluster[]>(`/experiments/${experimentId}/clusters`),
  create: (
    experimentId: string,
    data: {
      templateId?: string
      providerId: string
      region: string
      instanceTypeId?: string
      role?: string
      nodeCount?: number
      instances?: { instanceTypeId: string; role?: string; quantity: number; metadata?: Record<string, unknown> }[]
      instanceGroups?: { instanceTypeId: string; role?: string; quantity: number; metadata?: Record<string, unknown> }[]
    }
  ) => {
    const payload: Record<string, unknown> = {
      provider_id: data.providerId,
      region: data.region,
      cluster_template_id: data.templateId ?? undefined,
      environment_type: 'CLOUD',
    }

    if (data.role) payload['role'] = data.role
    if (data.nodeCount) payload['node_count'] = data.nodeCount
    const groups = data.instanceGroups || data.instances
    if (groups) payload['instance_groups'] = groups.map((i) => ({
      instance_type_id: i.instanceTypeId,
      role: i.role,
      quantity: i.quantity,
      metadata: i.metadata,
    }))

    return request<Cluster>(`/experiments/${experimentId}/clusters`, { method: "POST", body: payload })
  },
  scale: (clusterId: string, data: { nodeCount: number }) =>
    request<Cluster>(`/clusters/${clusterId}/scale`, { method: "POST", body: data }),
  updateNodes: (clusterId: string, data: { instanceGroups: { id: string; quantity: number }[] }) =>
    request<Cluster>(`/clusters/${clusterId}/nodes`, { method: "PATCH", body: {
      instance_groups: data.instanceGroups.map((g) => ({ id: g.id, quantity: g.quantity })),
    } }),
  destroy: (clusterId: string) => request(`/clusters/${clusterId}`, { method: "DELETE" }),
  instances: (clusterId: string) => request<Instance[]>(`/clusters/${clusterId}/instances`),
}
