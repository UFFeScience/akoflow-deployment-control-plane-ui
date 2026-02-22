import { request } from "./client"
import type { InstanceType } from "./types"

export const instanceTypesApi = {
  list: (providerId?: string) =>
    request<InstanceType[]>(providerId ? `/instance-types?provider_id=${providerId}` : "/instance-types"),
  create: (data: Partial<InstanceType>) => request<InstanceType>("/instance-types", { method: "POST", body: data }),
  updateStatus: (id: string, status: InstanceType["status"]) =>
    request<InstanceType>(`/instance-types/${id}/status`, { method: "PATCH", body: { status } }),
}
