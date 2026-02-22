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

export interface AuthResponse {
  message: string
  user: User
  token: string
}
