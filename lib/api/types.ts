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
  slug?: string
  runtime_type?: string
  description?: string
  is_public?: boolean
  owner_organization_id?: string
  executionMode?: "manual" | "scheduled" | "auto"
  latestVersion?: number
  versions_count?: number
  active_version?: TemplateVersion | null
  versions?: TemplateVersion[]
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
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
  /** Alias for API response which returns project_id */
  project_id?: string
  templateId?: string
  templateName?: string
  /** snake_case from API response */
  template_name?: string
  /** ID of the ExperimentTemplateVersion used when creating this experiment */
  experimentTemplateVersionId?: string
  experiment_template_version_id?: string
  /** Filled-in template form values (experiment_configuration + instance_configurations) */
  configurationJson?: Record<string, unknown>
  configuration_json?: Record<string, unknown>
  name: string
  description?: string
  status: "draft" | "running" | "failed" | "completed" | "pending"
  executionMode: "manual" | "scheduled" | "auto"
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
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
  slug?: string
  description?: string
  type: "CLOUD" | "ON_PREM" | "HPC"
  status: "ACTIVE" | "DEGRADED" | "DOWN" | "MAINTENANCE"
  health_status?: "HEALTHY" | "UNHEALTHY"
  health_message?: string
  last_health_check_at?: string
  credentials_count?: number
  regions?: string[]
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface ProviderVariableSchema {
  id: string
  provider_slug: string
  section: string
  name: string
  label: string
  description?: string
  type: "string" | "select" | "secret" | "boolean" | "textarea" | "number"
  required: boolean
  is_sensitive: boolean
  position: number
  options?: string[]
  default_value?: string
}

export interface ProviderCredentialValue {
  id: string
  provider_credential_id: string
  field_key: string
  field_value: string | null
}

export interface ProviderCredential {
  id: string
  provider_id: string
  name: string
  description?: string
  is_active: boolean
  values?: ProviderCredentialValue[]
  created_at?: string
  updated_at?: string
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
  templateId?: string
  template_id?: string
  version: string | number
  is_active?: boolean
  createdAt?: string
  created_at?: string
  metadata?: Record<string, unknown>
  definition_json?: TemplateDefinition
  terraform_module?: TerraformModule | null
}

export type TerraformProviderType = "aws" | "gcp" | "azure" | "custom"

export interface TerraformModule {
  id: string
  template_version_id: string
  module_slug?: string | null
  provider_type?: TerraformProviderType | null
  is_built_in?: boolean
  has_custom_hcl?: boolean
  // HCL files (only returned by the single-resource show endpoint)
  main_tf?: string | null
  variables_tf?: string | null
  outputs_tf?: string | null
  // Mapping definition fields → terraform variable names
  // { experiment_configuration: { fieldName: tfVarName }, instance_configurations: { instanceKey: { fieldName: tfVarName } } }
  tfvars_mapping_json?: {
    experiment_configuration?: Record<string, string>
    instance_configurations?: Record<string, Record<string, string>>
  } | null
  credential_env_keys?: string[]
  created_at?: string
  updated_at?: string
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
  type: "string" | "text" | "textarea" | "number" | "boolean" | "select" | "multiselect" | "array" | "object" | "script" | "key_value"
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
