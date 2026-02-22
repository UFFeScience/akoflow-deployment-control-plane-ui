import { request } from "./client"
import type { Template, TemplateVersion } from "./types"

export const templatesApi = {
  list: () => request<Template[]>("/experiment-templates"),
  create: (data: Partial<Template>) =>
    request<Template>("/experiment-templates", { method: "POST", body: data }),
  get: (id: string) => request<Template>(`/experiment-templates/${id}`),
  createVersion: (id: string, data: Partial<TemplateVersion>) =>
    request<Template>(`/experiment-templates/${id}/versions`, { method: "POST", body: data }),
}
