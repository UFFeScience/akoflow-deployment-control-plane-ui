import { request } from "./client"

export const uiApi = {
  getPasswordRules: () => request<{ rules: any }>("/ui/password-rules"),
  getPasswordRender: () => request<{ ui: any }>("/ui/render/password-rules"),
}
