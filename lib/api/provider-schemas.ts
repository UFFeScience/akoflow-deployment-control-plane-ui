import { request } from "./client"
import type { ProviderVariableSchema } from "./types"

export const providerSchemasApi = {
  listByProvider: (organizationId: string, providerId: string) =>
    request<ProviderVariableSchema[]>(`/organizations/${organizationId}/providers/${providerId}/schemas`),
  create: (organizationId: string, providerId: string, data: Partial<ProviderVariableSchema>) =>
    request<ProviderVariableSchema>(`/organizations/${organizationId}/providers/${providerId}/schemas`, {
      method: "POST",
      body: data,
    }),
}
