import { request } from "./client"
import type { Template } from "./types"

export const templatesApi = {
  list: () => request<Template[]>("/templates"),
  create: (data: Partial<Template>) =>
    request<Template>("/templates", { method: "POST", body: data }),
  get: (id: string) => request<Template>(`/templates/${id}`),
  update: (id: string, data: Partial<Template>) =>
    request<Template>(`/templates/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request(`/templates/${id}`, { method: "DELETE" }),
}
