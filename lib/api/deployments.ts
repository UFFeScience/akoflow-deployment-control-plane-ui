import { request } from "./client"
import type { Deployment } from "./types"

export interface ProviderCredentialEntry {
  provider_id: string
  credential_id?: string | null
}

export const deploymentsApi = {
  list: (environmentId: string) =>
    request<Deployment[]>(`/environments/${environmentId}/deployments`),

  create: (
    environmentId: string,
    data: {
      /** Legacy single-provider fields — used when providerCredentials is not set */
      providerId?: string
      credentialId?: string | null
      /** Multi-provider credentials — takes priority over legacy fields */
      providerCredentials?: ProviderCredentialEntry[]
      region?: string
      environmentType?: string
      name?: string
    }
  ) => {
    const payload: Record<string, unknown> = {
      environment_type: data.environmentType ?? "CLOUD",
    }

    if (data.providerCredentials && data.providerCredentials.length > 0) {
      payload["provider_credentials"] = data.providerCredentials
    } else {
      if (data.providerId) payload["provider_id"] = data.providerId
      if (data.credentialId) payload["provider_credential_id"] = data.credentialId
    }

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
