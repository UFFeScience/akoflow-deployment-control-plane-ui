const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options

  const token = typeof window !== "undefined" ? localStorage.getItem("akocloud_token") : null

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config)

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("akocloud_token")
      localStorage.removeItem("akocloud_user")
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }

  if (res.status === 204) return {} as T

  const responseJson = await res.json()
  const data = responseJson.data !== undefined ? responseJson.data : responseJson
  return data as T
}

export { API_BASE }
