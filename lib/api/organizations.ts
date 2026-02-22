import { request } from "./client"
import type { Organization } from "./types"

export const organizationsApi = {
  list: () => request<Organization[]>("/organizations"),
  create: (data: { name: string; description?: string }) =>
    request<Organization>("/organizations", { method: "POST", body: data }),
  get: (id: string) => request<Organization>(`/organizations/${id}`),
  update: (id: string, data: Partial<Organization>) =>
    request<Organization>(`/organizations/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request(`/organizations/${id}`, { method: "DELETE" }),
}
