import { request } from "./client"
import type { Provider, ProviderCredential } from "./types"

export const providersApi = {
  list: () => request<Provider[]>("/providers"),
  show: (id: string) => request<Provider>(`/providers/${id}`),
  create: (data: Partial<Provider>) => request<Provider>("/providers", { method: "POST", body: data }),
  checkHealth: (id: string) => request<Provider>(`/providers/${id}/health/check`, { method: "POST" }),

  // Credentials
  listCredentials: (providerId: string) =>
    request<ProviderCredential[]>(`/providers/${providerId}/credentials`),
  createCredential: (providerId: string, data: { name: string; description?: string; is_active?: boolean; values: Record<string, string> }) =>
    request<ProviderCredential>(`/providers/${providerId}/credentials`, { method: "POST", body: data }),
  deleteCredential: (providerId: string, credentialId: string) =>
    request<{ message: string }>(`/providers/${providerId}/credentials/${credentialId}`, { method: "DELETE" }),
}
