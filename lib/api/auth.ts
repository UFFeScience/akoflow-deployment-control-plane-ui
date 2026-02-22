import { request } from "./client"
import type { AuthResponse } from "./types"

export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: data }),
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: data }),
  lostPassword: (email: string) => request(`/lost?${new URLSearchParams({ email }).toString()}`),
  refresh: () => request<{ token: string }>("/auth/refresh", { method: "POST" }),
  logout: () => request("/auth/logout", { method: "POST" }),
}
