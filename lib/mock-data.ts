import type { Organization, Project, Environment, Instance, InstanceConfig, EnvironmentMetadata, Member, User, Template, LogEntry } from "./api"

export const mockUser: User = {
  id: "usr_1",
  name: "Alex Johnson",
  email: "alex@AkôFlow.io",
  avatar: "",
  createdAt: "2025-08-15T10:00:00Z",
}

export const mockOrganizations: Organization[] = [
  { id: "org_1", name: "NeuroLab Research", description: "Neuroscience and AI research laboratory", createdAt: "2025-09-01T08:00:00Z", memberCount: 8, projectCount: 3 },
  { id: "org_2", name: "Climate Data Consortium", description: "Global climate modeling initiative", createdAt: "2025-10-12T14:00:00Z", memberCount: 12, projectCount: 5 },
  { id: "org_3", name: "BioGenomics Inc.", description: "Genomic sequencing and analysis", createdAt: "2025-11-20T09:30:00Z", memberCount: 4, projectCount: 2 },
]

export const mockMembers: Member[] = [
  { id: "mem_1", userId: "usr_1", name: "Alex Johnson", email: "alex@AkôFlow.io", role: "admin", joinedAt: "2025-09-01T08:00:00Z" },
  { id: "mem_2", userId: "usr_2", name: "Sarah Chen", email: "sarah@neurolab.org", role: "member", joinedAt: "2025-09-05T10:00:00Z" },
  { id: "mem_3", userId: "usr_3", name: "Marcus Williams", email: "marcus@neurolab.org", role: "member", joinedAt: "2025-09-10T12:00:00Z" },
  { id: "mem_4", userId: "usr_4", name: "Priya Patel", email: "priya@neurolab.org", role: "admin", joinedAt: "2025-09-12T09:00:00Z" },
]

export const mockProjects: Project[] = [
  { id: "proj_1", organizationId: "org_1", name: "Neural Network Training", description: "Large-scale neural network training environments", createdAt: "2025-09-15T10:00:00Z", environmentCount: 4 },
  { id: "proj_2", organizationId: "org_1", name: "Image Recognition Pipeline", description: "Computer vision model pipeline", createdAt: "2025-10-01T14:00:00Z", environmentCount: 2 },
  { id: "proj_3", organizationId: "org_2", name: "Sea Level Prediction", description: "Machine learning models for sea level prediction", createdAt: "2025-10-20T09:00:00Z", environmentCount: 6 },
  { id: "proj_4", organizationId: "org_2", name: "Carbon Emission Analysis", description: "Global carbon emission pattern analysis", createdAt: "2025-11-01T11:00:00Z", environmentCount: 3 },
  { id: "proj_5", organizationId: "org_3", name: "Genome Sequencing v2", description: "Next-gen genome sequencing pipeline", createdAt: "2025-11-25T08:00:00Z", environmentCount: 1 },
]

export const mockTemplates: Template[] = [
  {
    id: "tmpl_1",
    name: "Federated Learning Template",
    description: "Distributed federated learning across multi-cloud GPU instances with aggregation server.",
    executionMode: "auto",
    defaultInstances: [
      { provider: "aws", region: "us-east-1", instanceType: "p3.2xlarge", quantity: 2, cpu: "8 vCPU", memory: "61 GB", gpu: "1x NVIDIA V100" },
      { provider: "gcp", region: "us-central1", instanceType: "a2-highgpu-1g", quantity: 1, cpu: "12 vCPU", memory: "85 GB", gpu: "1x NVIDIA A100" },
    ],
    requiredMetadata: ["framework", "dataset", "learning_rate", "rounds"],
    createdAt: "2025-10-01T10:00:00Z",
    environmentCount: 3,
  },
  {
    id: "tmpl_2",
    name: "AkoFlow Workflow Template",
    description: "Standard AkoFlow DAG-based workflow execution for data processing pipelines.",
    executionMode: "scheduled",
    defaultInstances: [
      { provider: "aws", region: "us-west-2", instanceType: "c5.4xlarge", quantity: 4, cpu: "16 vCPU", memory: "32 GB", gpu: "None" },
    ],
    requiredMetadata: ["dag_name", "schedule", "timeout"],
    createdAt: "2025-11-15T14:00:00Z",
    environmentCount: 5,
  },
  {
    id: "tmpl_3",
    name: "Custom HPC Template",
    description: "High-performance computing workloads on on-premise GPU deployments with SLURM scheduling.",
    executionMode: "manual",
    defaultInstances: [
      { provider: "hpc", region: "on-premise", instanceType: "hpc-node-large", quantity: 8, cpu: "64 vCPU", memory: "512 GB", gpu: "8x NVIDIA A100" },
    ],
    requiredMetadata: ["partition", "nodes", "time_limit"],
    createdAt: "2025-12-01T09:00:00Z",
    environmentCount: 2,
  },
]

export const mockEnvironments: Environment[] = [
  { id: "exp_1", projectId: "proj_1", templateId: "tmpl_1", templateName: "Federated Learning Template", name: "GPT Fine-tuning Run A", description: "Fine-tuning GPT model on domain-specific data", status: "running", executionMode: "auto", createdAt: "2025-12-01T10:00:00Z", updatedAt: "2026-01-15T18:30:00Z", instanceCount: 3, awsInstanceCount: 2, gcpInstanceCount: 1 },
  { id: "exp_2", projectId: "proj_1", templateId: "tmpl_2", templateName: "AkoFlow Workflow Template", name: "BERT Embedding Generation", description: "Generating BERT embeddings for document classification", status: "completed", executionMode: "manual", createdAt: "2025-11-20T14:00:00Z", updatedAt: "2025-12-10T09:00:00Z", instanceCount: 2, awsInstanceCount: 2, gcpInstanceCount: 0 },
  { id: "exp_3", projectId: "proj_1", name: "Transformer Benchmark", description: "Benchmarking different transformer architectures", status: "failed", executionMode: "scheduled", createdAt: "2026-01-05T08:00:00Z", updatedAt: "2026-01-06T03:45:00Z", instanceCount: 1, awsInstanceCount: 0, gcpInstanceCount: 1 },
  { id: "exp_4", projectId: "proj_1", name: "Data Augmentation Test", description: "Testing various data augmentation strategies", status: "draft", executionMode: "manual", createdAt: "2026-01-20T16:00:00Z", updatedAt: "2026-01-20T16:00:00Z", instanceCount: 0, awsInstanceCount: 0, gcpInstanceCount: 0 },
  { id: "exp_5", projectId: "proj_3", templateId: "tmpl_3", templateName: "Custom HPC Template", name: "Tide Pattern Analysis", description: "Analyzing ocean tide patterns using ML", status: "running", executionMode: "scheduled", createdAt: "2025-12-15T11:00:00Z", updatedAt: "2026-02-01T07:00:00Z", instanceCount: 4, awsInstanceCount: 1, gcpInstanceCount: 2 },
  { id: "exp_6", projectId: "proj_3", name: "Temperature Regression", description: "Temperature regression model training", status: "pending", executionMode: "auto", createdAt: "2026-01-10T09:00:00Z", updatedAt: "2026-01-10T09:00:00Z", instanceCount: 0, awsInstanceCount: 0, gcpInstanceCount: 0 },
]

export const mockInstances: Instance[] = [
  { id: "inst_1", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", provider: "aws", region: "us-east-1", status: "running", createdAt: "2025-12-01T10:30:00Z" },
  { id: "inst_2", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", provider: "gcp", region: "us-central1", status: "running", createdAt: "2025-12-01T10:35:00Z" },
  { id: "inst_3", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", provider: "aws", region: "eu-west-1", status: "pending", createdAt: "2025-12-02T08:00:00Z" },
  { id: "inst_4", environmentId: "exp_2", environmentName: "BERT Embedding Generation", provider: "hpc", region: "on-premise", status: "stopped", createdAt: "2025-11-20T14:30:00Z" },
  { id: "inst_5", environmentId: "exp_5", environmentName: "Tide Pattern Analysis", provider: "gcp", region: "asia-east1", status: "running", createdAt: "2025-12-15T11:30:00Z" },
  { id: "inst_6", environmentId: "exp_5", environmentName: "Tide Pattern Analysis", provider: "aws", region: "us-west-2", status: "running", createdAt: "2025-12-15T12:00:00Z" },
  { id: "inst_7", environmentId: "exp_5", environmentName: "Tide Pattern Analysis", provider: "gcp", region: "europe-west1", status: "pending", createdAt: "2025-12-16T09:00:00Z" },
  { id: "inst_8", environmentId: "exp_3", environmentName: "Transformer Benchmark", provider: "gcp", region: "us-east1", status: "failed", createdAt: "2026-01-05T08:30:00Z" },
]

export const mockConfigs: InstanceConfig[] = [
  { id: "cfg_1", instanceId: "inst_1", instanceType: "p3.2xlarge", quantity: 2, cpu: "8 vCPU", memory: "61 GB", gpu: "1x NVIDIA V100" },
  { id: "cfg_2", instanceId: "inst_1", instanceType: "p3.8xlarge", quantity: 1, cpu: "32 vCPU", memory: "244 GB", gpu: "4x NVIDIA V100" },
  { id: "cfg_3", instanceId: "inst_2", instanceType: "a2-highgpu-1g", quantity: 1, cpu: "12 vCPU", memory: "85 GB", gpu: "1x NVIDIA A100" },
  { id: "cfg_4", instanceId: "inst_4", instanceType: "hpc-node-large", quantity: 4, cpu: "64 vCPU", memory: "512 GB", gpu: "8x NVIDIA A100" },
  { id: "cfg_5", instanceId: "inst_5", instanceType: "a2-highgpu-1g", quantity: 2, cpu: "12 vCPU", memory: "85 GB", gpu: "1x NVIDIA A100" },
  { id: "cfg_6", instanceId: "inst_6", instanceType: "p3.2xlarge", quantity: 3, cpu: "8 vCPU", memory: "61 GB", gpu: "1x NVIDIA V100" },
  { id: "cfg_7", instanceId: "inst_8", instanceType: "n1-standard-8", quantity: 1, cpu: "8 vCPU", memory: "30 GB", gpu: "1x NVIDIA T4" },
]

export const mockMetadata: EnvironmentMetadata[] = [
  { id: "meta_1", environmentId: "exp_1", key: "framework", value: "PyTorch 2.1" },
  { id: "meta_2", environmentId: "exp_1", key: "dataset", value: "custom-nlp-v3" },
  { id: "meta_3", environmentId: "exp_1", key: "learning_rate", value: "3e-5" },
  { id: "meta_4", environmentId: "exp_1", key: "batch_size", value: "32" },
  { id: "meta_5", environmentId: "exp_2", key: "framework", value: "TensorFlow 2.14" },
  { id: "meta_6", environmentId: "exp_2", key: "embedding_dim", value: "768" },
  { id: "meta_7", environmentId: "exp_5", key: "model_type", value: "LSTM" },
  { id: "meta_8", environmentId: "exp_5", key: "epochs", value: "100" },
]

export const mockLogs: LogEntry[] = [
  { id: "log_1", timestamp: "2026-02-21T10:00:05Z", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", instanceId: "inst_1", provider: "aws", level: "info", message: "Training epoch 42/100 started. Loss: 0.0234, Accuracy: 96.8%", source: "trainer" },
  { id: "log_2", timestamp: "2026-02-21T09:58:12Z", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", instanceId: "inst_2", provider: "gcp", level: "info", message: "Gradient sync completed across 3 nodes in 1.2s", source: "distributed" },
  { id: "log_3", timestamp: "2026-02-21T09:55:30Z", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", instanceId: "inst_1", provider: "aws", level: "warning", message: "GPU memory usage at 94%. Consider reducing batch size.", source: "monitor" },
  { id: "log_4", timestamp: "2026-02-21T09:50:00Z", environmentId: "exp_3", environmentName: "Transformer Benchmark", instanceId: "inst_8", provider: "gcp", level: "error", message: "CUDA out of memory. Tried to allocate 2.00 GiB. GPU 0 has 0 bytes free.", source: "runtime" },
  { id: "log_5", timestamp: "2026-02-21T09:48:00Z", environmentId: "exp_5", environmentName: "Tide Pattern Analysis", instanceId: "inst_5", provider: "gcp", level: "info", message: "Data pipeline stage 3/5: Feature extraction completed. 1.2M records processed.", source: "pipeline" },
  { id: "log_6", timestamp: "2026-02-21T09:45:00Z", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", instanceId: "inst_3", provider: "aws", level: "info", message: "Instance provisioning complete. Joining training deployment.", source: "orchestrator" },
  { id: "log_7", timestamp: "2026-02-21T09:42:00Z", environmentId: "exp_5", environmentName: "Tide Pattern Analysis", instanceId: "inst_6", provider: "aws", level: "warning", message: "Network latency spike detected: 45ms avg (threshold: 20ms)", source: "monitor" },
  { id: "log_8", timestamp: "2026-02-21T09:40:00Z", environmentId: "exp_5", environmentName: "Tide Pattern Analysis", instanceId: "inst_7", provider: "gcp", level: "info", message: "Checkpoint saved: model_epoch_87.pt (size: 4.2 GB)", source: "checkpoint" },
  { id: "log_9", timestamp: "2026-02-21T09:35:00Z", environmentId: "exp_3", environmentName: "Transformer Benchmark", instanceId: "inst_8", provider: "gcp", level: "error", message: "Process terminated with exit code 137 (OOM Killed)", source: "system" },
  { id: "log_10", timestamp: "2026-02-21T09:30:00Z", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", instanceId: "inst_1", provider: "aws", level: "debug", message: "Batch 1024: forward pass 12ms, backward pass 34ms, optimizer step 5ms", source: "profiler" },
  { id: "log_11", timestamp: "2026-02-21T09:25:00Z", environmentId: "exp_5", environmentName: "Tide Pattern Analysis", instanceId: "inst_5", provider: "gcp", level: "info", message: "Validation loss: 0.0156 (best: 0.0148 at epoch 82)", source: "trainer" },
  { id: "log_12", timestamp: "2026-02-21T09:20:00Z", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", instanceId: "inst_2", provider: "gcp", level: "info", message: "Learning rate scheduler: cosine annealing, current LR: 2.1e-5", source: "scheduler" },
  { id: "log_13", timestamp: "2026-02-21T09:15:00Z", environmentId: "exp_5", environmentName: "Tide Pattern Analysis", instanceId: "inst_6", provider: "aws", level: "info", message: "Data loader: 8 workers active, prefetch factor: 4, batch queue: 12/16", source: "dataloader" },
  { id: "log_14", timestamp: "2026-02-21T09:10:00Z", environmentId: "exp_3", environmentName: "Transformer Benchmark", instanceId: "inst_8", provider: "gcp", level: "warning", message: "Approaching memory limit: 28.5/30 GB used", source: "monitor" },
  { id: "log_15", timestamp: "2026-02-21T09:05:00Z", environmentId: "exp_1", environmentName: "GPT Fine-tuning Run A", instanceId: "inst_1", provider: "aws", level: "info", message: "Mixed precision training enabled: FP16 with dynamic loss scaling", source: "runtime" },
]
