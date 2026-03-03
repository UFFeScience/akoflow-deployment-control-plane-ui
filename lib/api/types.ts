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
  role: "owner" | "member"
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
  instanceGroupId?: string
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

export interface InstanceGroup {
  id: string
  clusterId: string
  instanceTypeId: string
  instanceTypeName?: string
  instanceType?: string
  role?: string
  quantity: number
  metadata?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
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
  providerId?: string
  provider_id?: string
  name: string
  status: "ACTIVE" | "DEGRADED" | "DOWN" | "MAINTENANCE" | "AVAILABLE" | "UNAVAILABLE" | "DEPRECATED" | "active" | "inactive" | "deprecated"
  cpu?: string | number
  memory?: string | number
  memory_mb?: number
  gpu?: string | number
  gpu_count?: number
  vcpus?: number
  storage_default_gb?: number
  network_bandwidth?: string
  region?: string
  is_active?: boolean
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
  instanceGroups?: InstanceGroup[]
  createdAt?: string
  updatedAt?: string
}

export interface TemplateVersion {
  id: string
  templateId: string
  version: number
  createdAt?: string
  metadata?: Record<string, unknown>
  definition_json?: TemplateDefinition
}

export interface TemplateDefinition {
  cluster_defaults?: Record<string, unknown>
  ui?: {
    allow_multiple_instance_groups?: boolean
  }
  experiment_configuration?: TemplateExperimentConfiguration
  instance_configurations?: Record<string, TemplateInstanceConfiguration>
  cluster_topology?: TemplateClusterTopology
  sections?: FormSection[]
  lifecycle_hooks?: LifecycleHook[]
}

export interface TemplateExperimentConfiguration {
  label?: string
  description?: string
  type?: string
  sections: FormSection[]
}

export interface TemplateInstanceConfiguration {
  label: string
  description?: string
  type?: string
  position?: number
  sections: FormSection[]
}

export interface TemplateClusterTopology {
  description?: string
  instance_groups: TemplateClusterTopologyGroup[]
}

export interface TemplateClusterTopologyGroup {
  name: string
  label: string
  description?: string
  instance_group_template_slug?: string
  instance_group_template_id?: string
  quantity: number
  default_terraform_variables?: Record<string, unknown>
}

export interface FormSection {
  name: string
  label: string
  description?: string
  fields: FormField[]
}

export interface FormField {
  name: string
  label: string
  type: "string" | "text" | "number" | "boolean" | "select" | "multiselect" | "array" | "object" | "script" | "key_value"
  description?: string
  required?: boolean
  default?: unknown
  nullable?: boolean
  maxLength?: number
  maxItems?: number
  minItems?: number
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: string }[]
}

export interface LifecycleHook {
  name: string
  label: string
  type: "script"
  required?: boolean
  maxLength?: number
  description?: string
}

export interface InstanceGroupTemplate {
  id: string
  name: string
  slug: string
  category?: string
  description?: string
  definition: TemplateDefinition
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}
