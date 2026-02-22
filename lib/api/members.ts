import { request } from "./client"
import type { Member } from "./types"

export const membersApi = {
  list: (orgId: string) => request<Member[]>(`/organizations/${orgId}/members`),
  add: (orgId: string, data: { email: string; role: string }) =>
    request<Member>(`/organizations/${orgId}/members`, { method: "POST", body: data }),
  remove: (orgId: string, userId: string) =>
    request(`/organizations/${orgId}/members/${userId}`, { method: "DELETE" }),
  updateRole: (orgId: string, userId: string, role: string) =>
    request(`/organizations/${orgId}/members/${userId}/role`, { method: "PATCH", body: { role } }),
}
