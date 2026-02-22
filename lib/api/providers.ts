import { request } from "./client"
import type { Provider } from "./types"

export const providersApi = {
  list: () => request<Provider[]>("/providers"),
  create: (data: Partial<Provider>) => request<Provider>("/providers", { method: "POST", body: data }),
  checkHealth: (id: string) => request<Provider>(`/providers/${id}/health`, { method: "PATCH" }),
}
