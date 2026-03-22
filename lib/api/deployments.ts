import { request } from "./client"
import type { Deployment, Instance } from "./types"

export const clustersApi = {
  list: (environmentId: string) => request<Deployment[]>(`/environments/${environmentId}/deployments`),
  create: (
    environmentId: string,
    data: {
      templateId?: string
      providerId: string
      credentialId: string
      region?: string
      instanceTypeId?: string
      role?: string
      nodeCount?: number
      instances?: { instanceTypeId: string; instanceGroupTemplateId?: string; role?: string; quantity: number; metadata?: Record<string, unknown>; terraformVariables?: Record<string, unknown>; lifecycleHooks?: Record<string, string> }[]
      instanceGroups?: { instanceTypeId: string; instanceGroupTemplateId?: string; role?: string; quantity: number; metadata?: Record<string, unknown>; terraformVariables?: Record<string, unknown>; lifecycleHooks?: Record<string, string> }[]
    }
  ) => {
    const payload: Record<string, unknown> = {
      provider_id: data.providerId,
      provider_credential_id: data.credentialId,
      cluster_template_id: data.templateId ?? undefined,
      environment_type: 'CLOUD',
    }

    if (data.region) payload['region'] = data.region

    if (data.role) payload['role'] = data.role
    if (data.nodeCount) payload['node_count'] = data.nodeCount
    const groups = data.instanceGroups || data.instances
    if (groups) payload['instance_groups'] = groups.map((i) => ({
      instance_type_id: i.instanceTypeId,
      instance_group_template_id: i.instanceGroupTemplateId,
      role: i.role,
      quantity: i.quantity,
      metadata: i.metadata,
      terraform_variables: i.terraformVariables,
      lifecycle_hooks: i.lifecycleHooks,
    }))

    return request<Deployment>(`/environments/${environmentId}/deployments`, { method: "POST", body: payload })
  },
  scale: (clusterId: string, data: { nodeCount: number }) =>
    request<Deployment>(`/deployments/${clusterId}/scale`, { method: "POST", body: data }),
  updateNodes: (clusterId: string, data: { instanceGroups: { id: string; quantity: number }[] }) =>
    request<Deployment>(`/deployments/${clusterId}/nodes`, { method: "PATCH", body: {
      instance_groups: data.instanceGroups.map((g) => ({ id: g.id, quantity: g.quantity })),
    } }),
  destroy: (clusterId: string) => request(`/deployments/${clusterId}`, { method: "DELETE" }),
  instances: (clusterId: string) => request<Instance[]>(`/deployments/${clusterId}/instances`),
}
