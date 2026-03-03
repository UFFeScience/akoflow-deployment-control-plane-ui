import { request } from "./client"
import type { ProviderVariableSchema } from "./types"

export const providerSchemasApi = {
  listAll: () => request<ProviderVariableSchema[]>("/provider-type-schemas"),
  listBySlug: (slug: string) => request<ProviderVariableSchema[]>(`/provider-type-schemas/${slug}`),
}
