const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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

export interface AuthResponse {
  message: string
  user: User
  token: string
}

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: data }),
  register: (data: { name: string; email: string; password: string, password_confirmation: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: data }),
  lostPassword: (email: string) =>
    request(`/lost?${new URLSearchParams({ email }).toString()}`),
  refresh: () => request<{ token: string }>("/auth/refresh", { method: "POST" }),
  logout: () => request("/auth/logout", { method: "POST" }),
}

// UI / Render helpers
export const uiApi = {
  getPasswordRules: () => request<{ rules: any }>('/ui/password-rules'),
  getPasswordRender: () => request<{ ui: any }>('/ui/render/password-rules'),
}

// User
export const userApi = {
  get: () => request<User>("/user"),
  update: (data: Partial<User>) => request<User>("/user", { method: "PATCH", body: data }),
  delete: () => request("/user", { method: "DELETE" }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request("/user/password", { method: "PATCH", body: data }),
}

// Organizations
export const organizationsApi = {
  list: () => request<Organization[]>("/organizations"),
  create: (data: { name: string; description?: string }) =>
    request<Organization>("/organizations", { method: "POST", body: data }),
  get: (id: string) => request<Organization>(`/organizations/${id}`),
  update: (id: string, data: Partial<Organization>) =>
    request<Organization>(`/organizations/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request(`/organizations/${id}`, { method: "DELETE" }),
}

// Organization Members
export const membersApi = {
  list: (orgId: string) => request<Member[]>(`/organizations/${orgId}/members`),
  add: (orgId: string, data: { email: string; role: string }) =>
    request<Member>(`/organizations/${orgId}/members`, { method: "POST", body: data }),
  remove: (orgId: string, userId: string) =>
    request(`/organizations/${orgId}/members/${userId}`, { method: "DELETE" }),
  updateRole: (orgId: string, userId: string, role: string) =>
    request(`/organizations/${orgId}/members/${userId}/role`, { method: "PATCH", body: { role } }),
}

// Projects
export const projectsApi = {
  list: (orgId: string) => request<Project[]>(`/organizations/${orgId}/projects`),
  create: (orgId: string, data: { name: string; description?: string }) =>
    request<Project>(`/organizations/${orgId}/projects`, { method: "POST", body: data }),
  get: (orgId: string, projectId: string) =>
    request<Project>(`/organizations/${orgId}/projects/${projectId}`),
  update: (orgId: string, projectId: string, data: Partial<Project>) =>
    request<Project>(`/organizations/${orgId}/projects/${projectId}`, { method: "PATCH", body: data }),
  delete: (orgId: string, projectId: string) =>
    request(`/organizations/${orgId}/projects/${projectId}`, { method: "DELETE" }),
}

// Templates
export const templatesApi = {
  list: () => request<Template[]>("/templates"),
  create: (data: Partial<Template>) =>
    request<Template>("/templates", { method: "POST", body: data }),
  get: (id: string) => request<Template>(`/templates/${id}`),
  update: (id: string, data: Partial<Template>) =>
    request<Template>(`/templates/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => request(`/templates/${id}`, { method: "DELETE" }),
}

// Experiments
export const experimentsApi = {
  list: (projectId: string) => request<Experiment[]>(`/projects/${projectId}/experiments`),
  create: (projectId: string, data: { name: string; description?: string; status?: string; executionMode?: string; templateId?: string }) =>
    request<Experiment>(`/projects/${projectId}/experiments`, { method: "POST", body: data }),
  get: (projectId: string, experimentId: string) =>
    request<Experiment>(`/projects/${projectId}/experiments/${experimentId}`),
  update: (projectId: string, experimentId: string, data: Partial<Experiment>) =>
    request<Experiment>(`/projects/${projectId}/experiments/${experimentId}`, { method: "PATCH", body: data }),
  delete: (projectId: string, experimentId: string) =>
    request(`/projects/${projectId}/experiments/${experimentId}`, { method: "DELETE" }),
}

// Instances
export const instancesApi = {
  list: (experimentId: string) => request<Instance[]>(`/experiments/${experimentId}/instances`),
  create: (experimentId: string, data: { provider: string; region: string }) =>
    request<Instance>(`/experiments/${experimentId}/instances`, { method: "POST", body: data }),
  delete: (experimentId: string, instanceId: string) =>
    request(`/experiments/${experimentId}/instances/${instanceId}`, { method: "DELETE" }),
  scale: (experimentId: string, instanceId: string, configId: string, quantity: number) =>
    request(`/experiments/${experimentId}/instances/${instanceId}/config/${configId}/scale`, { method: "POST", body: { quantity } }),
}

// Instance Config
export const configApi = {
  create: (instanceId: string, data: Partial<InstanceConfig>) =>
    request<InstanceConfig>(`/instances/${instanceId}/config`, { method: "POST", body: data }),
  update: (instanceId: string, configId: string, data: Partial<InstanceConfig>) =>
    request<InstanceConfig>(`/instances/${instanceId}/config/${configId}`, { method: "PATCH", body: data }),
  delete: (instanceId: string, configId: string) =>
    request(`/instances/${instanceId}/config/${configId}`, { method: "DELETE" }),
}

// Metadata
export const metadataApi = {
  create: (experimentId: string, data: { key: string; value: string }) =>
    request<ExperimentMetadata>(`/experiments/${experimentId}/metadata`, { method: "POST", body: data }),
  delete: (experimentId: string, metadataId: string) =>
    request(`/experiments/${experimentId}/metadata/${metadataId}`, { method: "DELETE" }),
}

// Logs
export const logsApi = {
  list: (params?: { experimentId?: string; instanceId?: string; level?: string; provider?: string }) =>
    request<LogEntry[]>(`/logs?${new URLSearchParams(params as Record<string, string>).toString()}`),
}

// Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt?: string
}

export interface Organization {
  id: string
  name: string
  description?: string
  createdAt?: string
  memberCount?: number
  projectCount?: number
}

export interface Member {
  id: string
  userId: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
  joinedAt?: string
}

export interface Project {
  id: string
  organizationId: string
  name: string
  description?: string
  createdAt?: string
  experimentCount?: number
}

export interface Template {
  id: string
  name: string
  description?: string
  executionMode: "manual" | "scheduled" | "auto"
  defaultInstances: TemplateInstance[]
  requiredMetadata: string[]
  createdAt?: string
  experimentCount?: number
}

export interface TemplateInstance {
  provider: "aws" | "gcp" | "hpc"
  region: string
  instanceType: string
  quantity: number
  cpu: string
  memory: string
  gpu: string
}

export interface Experiment {
  id: string
  projectId: string
  templateId?: string
  templateName?: string
  name: string
  description?: string
  status: "draft" | "running" | "failed" | "completed" | "pending"
  executionMode: "manual" | "scheduled" | "auto"
  createdAt?: string
  updatedAt?: string
  instanceCount?: number
  awsInstanceCount?: number
  gcpInstanceCount?: number
  metadata?: ExperimentMetadata[]
}

export interface Instance {
  id: string
  experimentId: string
  experimentName?: string
  provider: "aws" | "gcp" | "hpc"
  region: string
  status: "running" | "stopped" | "pending" | "failed"
  createdAt?: string
  configs?: InstanceConfig[]
}

export interface InstanceConfig {
  id: string
  instanceId: string
  instanceType: string
  quantity: number
  cpu: string
  memory: string
  gpu: string
}

export interface ExperimentMetadata {
  id: string
  experimentId: string
  key: string
  value: string
}

export interface LogEntry {
  id: string
  timestamp: string
  experimentId?: string
  experimentName?: string
  instanceId?: string
  provider?: "aws" | "gcp" | "hpc"
  level: "info" | "warning" | "error" | "debug"
  message: string
  source?: string
}
