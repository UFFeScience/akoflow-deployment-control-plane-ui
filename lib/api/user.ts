import { request } from "./client"
import type { User } from "./types"

export const userApi = {
  get: () => request<User>("/user"),
  update: (data: Partial<User>) => request<User>("/user", { method: "PATCH", body: data }),
  delete: () => request("/user", { method: "DELETE" }),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request("/user/password", {
      method: "PATCH",
      body: {
        current_password: data.currentPassword,
        new_password: data.newPassword,
        new_password_confirmation: data.confirmPassword,
      },
    }),
}
