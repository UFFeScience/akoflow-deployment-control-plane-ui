export type ProviderType = "AWS" | "GCP" | "AZURE" | "ON_PREM" | "HPC" | "CUSTOM" | "LOCAL"

export const DEFAULT_HCL: Record<string, string> = {
  AWS: `terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Credentials injected via env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
provider "aws" {}

# Calls AWS STS to verify the credentials have valid API access
data "aws_caller_identity" "current" {}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "user_id" {
  value = data.aws_caller_identity.current.user_id
}`,

  GCP: `terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Credentials injected via env: GOOGLE_CREDENTIALS, GOOGLE_PROJECT, GOOGLE_REGION
provider "google" {}

# Calls Resource Manager API (projects.get) — requires resourcemanager.projects.get on the project
data "google_project" "current" {}

output "project_id" {
  value = data.google_project.current.project_id
}

output "project_number" {
  value = data.google_project.current.number
}`,

  LOCAL: `terraform {
  required_version = ">= 1.5"
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

variable "host" {}
variable "user" {}

variable "ssh_password" {
  default   = ""
  sensitive = true
}

variable "ssh_private_key" {
  default   = ""
  sensitive = true
}

# Connects via SSH (password or private key) and runs basic commands to verify the host is reachable
resource "null_resource" "health_check" {
  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      host        = var.host
      user        = var.user
      password    = var.ssh_password != "" ? var.ssh_password : null
      private_key = var.ssh_private_key != "" ? var.ssh_private_key : null
    }

    inline = [
      "echo 'Connected to host'",
      "hostname",
      "docker ps",
      "kubectl get pods || true",
    ]
  }
}`,

  HPC: `terraform {
  required_version = ">= 1.5"
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

# Adjust this template to match your HPC cluster connectivity check
resource "null_resource" "health_check" {
  connection {
    type        = "ssh"
    host        = var.slurm_host
    user        = var.slurm_username
    private_key = var.slurm_ssh_private_key
  }

  provisioner "remote-exec" {
    inline = ["sinfo --version"]
  }
}

variable "slurm_host"            {}
variable "slurm_username"        {}
variable "slurm_ssh_private_key" { sensitive = true }`,

  CUSTOM: `terraform {
  required_version = ">= 1.5"
  # Add any required_providers here

  # required_providers {
  #   example = {
  #     source  = "hashicorp/example"
  #     version = "~> 1.0"
  #   }
  # }
}

# Define your health check logic below.
# The check is run with 'terraform plan'. A successful plan means HEALTHY.
#
# You can inject credential values via environment variables by adding them
# in the provider configuration above.`,
}

export function getDefaultHcl(type?: ProviderType): string {
  if (!type) return DEFAULT_HCL.CUSTOM
  return DEFAULT_HCL[type] ?? DEFAULT_HCL.CUSTOM
}
