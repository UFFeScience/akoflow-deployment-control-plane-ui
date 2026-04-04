import { request } from "./client"
import type { Provider, ProviderCredential, ProviderCredentialHealthLog } from "./types"

type CreateProviderPayload = Partial<Provider> & { variable_schemas?: unknown[] }

export const providersApi = {
  list: (organizationId: string) =>
    request<Provider[]>(`/organizations/${organizationId}/providers`),
  show: (organizationId: string, id: string) =>
    request<Provider>(`/organizations/${organizationId}/providers/${id}`),
  create: (organizationId: string, data: CreateProviderPayload) =>
    request<Provider>(`/organizations/${organizationId}/providers`, { method: "POST", body: data }),
  checkHealth: (organizationId: string, id: string) =>
    request<ProviderCredential[]>(`/organizations/${organizationId}/providers/${id}/health/check`, { method: "POST" }),

  // Credentials
  listCredentials: (organizationId: string, providerId: string) =>
    request<ProviderCredential[]>(`/organizations/${organizationId}/providers/${providerId}/credentials`),
  createCredential: (organizationId: string, providerId: string, data: { name: string; slug: string; description?: string; is_active?: boolean; health_check_template: string; values: Record<string, string> }) =>
    request<ProviderCredential>(`/organizations/${organizationId}/providers/${providerId}/credentials`, { method: "POST", body: data }),
  deleteCredential: (organizationId: string, providerId: string, credentialId: string) =>
    request<{ message: string }>(`/organizations/${organizationId}/providers/${providerId}/credentials/${credentialId}`, { method: "DELETE" }),
  checkCredentialHealth: (organizationId: string, providerId: string, credentialId: string) =>
    request<ProviderCredential>(`/organizations/${organizationId}/providers/${providerId}/credentials/${credentialId}/health/check`, { method: "POST" }),
  listCredentialHealthLogs: (organizationId: string, providerId: string, credentialId: string) =>
    request<ProviderCredentialHealthLog[]>(`/organizations/${organizationId}/providers/${providerId}/credentials/${credentialId}/health/logs`),
}
