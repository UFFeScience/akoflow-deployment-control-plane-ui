import { request } from "./client"
import type { Deployment } from "./types"

export const deploymentsApi = {
  list: (environmentId: string) =>
    request<Deployment[]>(`/environments/${environmentId}/deployments`),

  create: (
    environmentId: string,
    data: {
      providerId: string
      credentialId?: string | null
      region?: string
      environmentType?: string
      name?: string
    }
  ) => {
    const payload: Record<string, unknown> = {
      provider_id: data.providerId,
      environment_type: data.environmentType ?? "CLOUD",
    }
    if (data.credentialId) payload["provider_credential_id"] = data.credentialId
    if (data.region) payload["region"] = data.region
    if (data.name) payload["name"] = data.name

    return request<Deployment>(`/environments/${environmentId}/deployments`, {
      method: "POST",
      body: payload,
    })
  },

  destroy: (deploymentId: string) =>
    request(`/deployments/${deploymentId}`, { method: "DELETE" }),
}
