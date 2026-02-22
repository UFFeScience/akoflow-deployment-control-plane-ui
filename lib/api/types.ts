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
  executionMode?: "manual" | "scheduled" | "auto"
  latestVersion?: number
  versions?: TemplateVersion[]
  createdAt?: string
  updatedAt?: string
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
  clusterId?: string
  role?: string
  health?: string
  publicIp?: string
  privateIp?: string
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

export interface Provider {
  id: string
  name: string
  status: "UP" | "DEGRADED" | "DOWN"
  regions?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface InstanceType {
  id: string
  providerId: string
  name: string
  status: "active" | "inactive" | "deprecated"
  cpu?: string
  memory?: string
  gpu?: string
  region?: string
  createdAt?: string
  updatedAt?: string
}

export interface Cluster {
  id: string
  experimentId: string
  name?: string
  providerId: string
  providerName?: string
  region: string
  role?: string
  nodeCount: number
  instanceTypeId: string
  instanceType?: string
  status: "creating" | "running" | "failed" | "deleting" | "scaling" | "stopped"
  createdAt?: string
  updatedAt?: string
}

export interface TemplateVersion {
  id: string
  templateId: string
  version: number
  createdAt?: string
  metadata?: Record<string, unknown>
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}
