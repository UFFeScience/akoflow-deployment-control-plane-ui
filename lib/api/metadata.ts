import { request } from "./client"
import type { EnvironmentMetadata } from "./types"

export const metadataApi = {
  create: (environmentId: string, data: { key: string; value: string }) =>
    request<EnvironmentMetadata>(`/environments/${environmentId}/metadata`, { method: "POST", body: data }),
  delete: (environmentId: string, metadataId: string) =>
    request(`/environments/${environmentId}/metadata/${metadataId}`, { method: "DELETE" }),
}
