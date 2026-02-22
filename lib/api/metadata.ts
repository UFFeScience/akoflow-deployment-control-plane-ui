import { request } from "./client"
import type { ExperimentMetadata } from "./types"

export const metadataApi = {
  create: (experimentId: string, data: { key: string; value: string }) =>
    request<ExperimentMetadata>(`/experiments/${experimentId}/metadata`, { method: "POST", body: data }),
  delete: (experimentId: string, metadataId: string) =>
    request(`/experiments/${experimentId}/metadata/${metadataId}`, { method: "DELETE" }),
}
