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
  environmentCount?: number
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
  environmentCount?: number
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

export interface Environment {
  id: string
  projectId: string
  /** Alias for API response which returns project_id */
  project_id?: string
  /** Project name returned by the all-environments endpoint */
  project_name?: string
  templateId?: string
  templateName?: string
  /** snake_case from API response */
  template_name?: string
  /** ID of the EnvironmentTemplateVersion used when creating this environment */
  environmentTemplateVersionId?: string
  environment_template_version_id?: string
  /** Filled-in template form values (environment_configuration) */
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
  metadata?: EnvironmentMetadata[]
}

export interface Instance {
  id: string
  environmentId: string
  environmentName?: string
  instanceGroupId?: string
  provider: "aws" | "gcp" | "hpc"
  region: string
  status: "running" | "stopped" | "pending" | "failed"
  deploymentId?: string
  role?: string
  health?: string
  publicIp?: string
  privateIp?: string
  createdAt?: string
  configs?: InstanceConfig[]
}

export interface InstanceGroup {
  id: string
  deploymentId: string
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

export interface EnvironmentMetadata {
  id: string
  environmentId: string
  key: string
  value: string
}

export interface LogEntry {
  id: number
  terraform_run_id?: string | null
  provisioned_resource_id?: string | null
  environment_id?: string | null
  timestamp: string
  level: "info" | "warning" | "error" | "debug"
  message: string
  source?: string
  created_at?: string
}

export interface Provider {
  id: string
  name: string
  slug?: string
  default_module_slug?: string | null
  description?: string
  type: "AWS" | "GCP" | "AZURE" | "ON_PREM" | "HPC" | "CUSTOM" | "LOCAL"
  status: string
  credentials_count?: number
  healthy_credentials_count?: number
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

export interface ProviderCredentialHealthLog {
  id: string
  health_status: string
  health_message?: string | null
  checked_at: string
}

export interface ProviderCredential {
  id: string
  provider_id: string
  name: string
  slug?: string
  description?: string
  is_active: boolean
  health_check_template?: string | null
  health_status?: string
  health_message?: string | null
  last_health_check_at?: string | null
  health_logs?: ProviderCredentialHealthLog[]
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

export interface DeploymentProviderCredential {
  id: string
  provider_id: string
  provider_slug?: string | null
  provider_credential_id?: string | null
}

export interface Deployment {
  id: string
  // snake_case from API
  environment_id?: string
  provider_credentials?: DeploymentProviderCredential[]
  deployment_template_id?: string | null
  environment_type?: string
  provider_type?: string
  provider_name?: string
  provider_slug?: string
  provider_id?: string | null
  // camelCase normalized
  environmentId?: string
  providerType?: string
  providerName?: string
  providerSlug?: string
  providerId?: string
  region?: string | null
  name?: string
  status: string
  resources?: ProvisionedResource[]
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

// ── Provisioned resource taxonomy ─────────────────────────────────────────────

export interface ProvisionedResourceKind {
  id: string
  /** compute | storage | serverless | database | network | container */
  slug: string
  name: string
  description?: string
  is_active: boolean
}

export interface ProvisionedResourceType {
  id: string
  provisioned_resource_kind_id: string
  kind?: ProvisionedResourceKind
  provider_id?: string | null
  /** e.g. aws_ec2 | gcp_compute_engine | aws_lambda | aws_s3 | aws_rds */
  slug: string
  name: string
  description?: string
  /** Terraform resource type identifier, e.g. aws_instance */
  provider_resource_identifier?: string | null
  attributes_schema_json?: Record<string, unknown> | null
  is_active: boolean
}

/** A cloud (or on-prem/serverless) resource created by terraform apply. */
export interface ProvisionedResource {
  id: string
  deployment_id: string
  deploymentId?: string
  provisioned_resource_type_id: string
  resource_type?: ProvisionedResourceType
  /** Opaque ID from the provider, e.g. "i-0abc123" */
  provider_resource_id?: string | null
  name?: string | null
  /** PENDING | CREATING | RUNNING | STOPPING | STOPPED | ERROR | DESTROYED */
  status: string
  health_status?: string | null
  last_health_check_at?: string | null
  public_ip?: string | null
  private_ip?: string | null
  metadata_json?: {
    akoflow_iframe_url?: string
    [key: string]: unknown
  } | null
  created_at?: string
  updated_at?: string
}

export interface ResourceLogEntry {
  id: string
  provisioned_resource_id: string
  /** DEBUG | INFO | WARN | ERROR */
  level: string
  message: string
  created_at: string
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
  terraform_modules?: TerraformModule[]
  provider_configurations?: ProviderConfiguration[]
}

export type TerraformProviderType = string

export interface TerraformModule {
  id: string
  provider_configuration_id: string
  module_slug?: string | null
  is_built_in?: boolean
  has_custom_hcl?: boolean
  main_tf?: string | null
  variables_tf?: string | null
  outputs_tf?: string | null
  tfvars_mapping_json?: {
    environment_configuration?: Record<string, string>
  } | null
  outputs_mapping_json?: {
    resources?: Array<{
      name: string
      terraform_type?: string
      outputs: {
        provider_resource_id?: string
        public_ip?: string
        private_ip?: string
        iframe_url?: string
        metadata?: Record<string, string>
      }
    }>
  } | null
  credential_env_keys?: string[]
  created_at?: string
  updated_at?: string
}

export interface AnsiblePlaybook {
  id: string
  provider_configuration_id: string
  provider_type?: string
  phase?: string
  playbook_slug?: string | null
  is_built_in?: boolean
  has_custom_playbook?: boolean
  playbook_yaml?: string | null
  inventory_template?: string | null
  vars_mapping_json?: {
    environment_configuration?: Record<string, string>
    instance_configurations?: Record<string, Record<string, string>>
  } | null
  outputs_mapping_json?: {
    resources?: Array<{
      name: string
      ansible_resource_type?: string
      outputs: {
        provider_resource_id?: string
        public_ip?: string
        private_ip?: string
        iframe_url?: string
        metadata?: Record<string, string>
      }
    }>
  } | null
  credential_env_keys?: string[]
  roles_json?: Array<{ name: string; version?: string } | string> | null
  created_at?: string
  updated_at?: string
}

export interface Runbook {
  id: string
  provider_configuration_id: string
  name: string
  description?: string | null
  trigger?: PlaybookTrigger
  playbook_yaml?: string | null
  vars_mapping_json?: Record<string, unknown> | null
  credential_env_keys?: string[]
  roles_json?: Array<{ name: string; version?: string } | string> | null
  position?: number
  created_at?: string
  updated_at?: string
}

/** Trigger values for AnsiblePlaybook */
export type PlaybookTrigger = "after_provision" | "when_ready" | "manual" | "before_teardown"

export interface Playbook {
  id: string
  provider_configuration_id: string
  name: string
  description?: string | null
  trigger: PlaybookTrigger
  playbook_slug?: string | null
  playbook_yaml?: string | null
  inventory_template?: string | null
  vars_mapping_json?: Record<string, unknown> | null
  outputs_mapping_json?: Record<string, unknown> | null
  credential_env_keys?: string[]
  roles_json?: Array<{ name: string; version?: string } | string> | null
  position?: number
  enabled?: boolean
  tasks?: Array<{
    id?: string
    name: string
    module?: string | null
    module_args_json?: Record<string, unknown> | null
    when_condition?: string | null
    become?: boolean
    tags_json?: string[] | null
    enabled?: boolean
    position?: number
  }>
  created_at?: string
  updated_at?: string
}

export interface PlaybookRun {
  id: string
  deployment_id: string | number
  playbook_id?: string | number | null
  playbook_name?: string
  activity_id?: string | number | null
  activity_name?: string
  trigger: PlaybookTrigger
  triggered_by?: string
  /** QUEUED | INITIALIZING | RUNNING | COMPLETED | FAILED */
  status: string
  provider_type?: string
  workspace_path?: string
  extra_vars?: Record<string, unknown>
  output?: Record<string, unknown>
  task_host_statuses?: PlaybookRunTaskHostStatus[]
  started_at?: string | null
  finished_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface PlaybookRunTaskHostStatus {
  id: string | number
  ansible_playbook_run_id: string | number
  ansible_playbook_task_id?: string | number | null
  host: string
  task_name: string
  module?: string | null
  position?: number | null
  /** PENDING | RUNNING | OK | CHANGED | FAILED | SKIPPED | UNREACHABLE */
  status: string
  output?: string | null
  started_at?: string | null
  finished_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProviderConfiguration {
  id: string
  template_version_id: string
  name: string
  applies_to_providers: string[]
  terraform_module?: TerraformModule | null
  ansible_playbook?: AnsiblePlaybook | null
  teardown_playbook?: AnsiblePlaybook | null
  runbooks?: Runbook[]
  playbooks?: Playbook[]
  activities?: Playbook[]
  created_at?: string
  updated_at?: string
}

export interface TemplateDefinitionProviderConfig {
  label: string
  providers: string[]
  tool?: "terraform" | "ansible"
  required?: boolean
}

export interface TemplateDefinition {
  /**
   * All provider slugs this template supports.
   * Drives the credential selectors and the config-step provider tabs.
   */
  providers?: string[]
  /**
   * Subset of `providers` that are mandatory for every deployment.
   */
  required_providers?: string[]
  /**
   * Minimum number of providers the user must select for a deployment.
   */
  min_providers?: number
  /**
   * Named provider configurations. Each entry describes one supported
   * combination of cloud providers and deployment tool (Terraform / Ansible).
   */
  provider_configurations?: TemplateDefinitionProviderConfig[]
  deployment_defaults?: Record<string, unknown>
  ui?: {
    allow_multiple_instance_groups?: boolean
  }
  environment_configuration?: TemplateEnvironmentConfiguration
  deployment_topology?: TemplateDeploymentTopology
  sections?: FormSection[]
  lifecycle_hooks?: LifecycleHook[]
}

export interface TemplateEnvironmentConfiguration {
  label?: string
  description?: string
  type?: string
  groups?: TemplateConfigGroup[]
  sections: FormSection[]
}

export interface TemplateConfigGroup {
  name: string
  label: string
  description?: string
  icon?: string
}

export interface TemplateDeploymentTopology {
  description?: string
  instance_groups: TemplateDeploymentTopologyGroup[]
}

export interface TemplateDeploymentTopologyGroup {
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
  group?: string
  /**
   * When set, this entire section is only relevant for the listed provider slugs.
   * The UI can use this to show/hide or annotate the section.
   * Examples: ["aws"], ["gcp"], ["aws", "gcp"]
   */
  providers?: string[]
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
  /**
   * When set, this field is only relevant for the listed provider slugs.
   * Examples: ["aws"], ["gcp"]
   */
  providers?: string[]
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

export interface TerraformRun {
  id: string
  environment_id: string
  action: string
  status: string
  provider_type?: string
  workspace_path?: string
  tfvars?: Record<string, unknown>
  output?: Record<string, unknown>
  started_at?: string | null
  finished_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface AnsibleRun {
  id: string
  deployment_id: string
  action: string
  /** INITIALIZING | RUNNING | COMPLETED | FAILED */
  status: string
  provider_type?: string
  workspace_path?: string
  extra_vars?: Record<string, unknown>
  output?: Record<string, unknown>
  started_at?: string | null
  finished_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface RunbookRun {
  id: string
  runbook_id: string | number
  runbook_name?: string
  deployment_id?: string | number | null
  environment_id?: string
  triggered_by?: string
  /** QUEUED | RUNNING | COMPLETED | FAILED */
  status: string
  started_at?: string | null
  finished_at?: string | null
  created_at?: string
  updated_at?: string
}

export type ActivityTrigger = PlaybookTrigger
export type Activity = Playbook
export type ActivityRun = PlaybookRun
export type { Playbook as PlaybookActivity, PlaybookRun as PlaybookActivityRun }
export type { PlaybookRun as AnsiblePlaybookRun }
export type { PlaybookRun as AnsibleActivityRun, Playbook as AnsibleActivity }
