import { request } from "./client"
import type { Provider, ProviderCredential } from "./types"

export const providersApi = {
  list: (organizationId: string) =>
    request<Provider[]>(`/organizations/${organizationId}/providers`),
  show: (organizationId: string, id: string) =>
    request<Provider>(`/organizations/${organizationId}/providers/${id}`),
  create: (organizationId: string, data: Partial<Provider>) =>
    request<Provider>(`/organizations/${organizationId}/providers`, { method: "POST", body: data }),
  checkHealth: (organizationId: string, id: string) =>
    request<Provider>(`/organizations/${organizationId}/providers/${id}/health/check`, { method: "POST" }),

  // Credentials
  listCredentials: (organizationId: string, providerId: string) =>
    request<ProviderCredential[]>(`/organizations/${organizationId}/providers/${providerId}/credentials`),
  createCredential: (organizationId: string, providerId: string, data: { name: string; description?: string; is_active?: boolean; values: Record<string, string> }) =>
    request<ProviderCredential>(`/organizations/${organizationId}/providers/${providerId}/credentials`, { method: "POST", body: data }),
  deleteCredential: (organizationId: string, providerId: string, credentialId: string) =>
    request<{ message: string }>(`/organizations/${organizationId}/providers/${providerId}/credentials/${credentialId}`, { method: "DELETE" }),
}
