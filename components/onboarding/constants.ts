export const LOCAL_HEALTH_CHECK_TEMPLATE = `terraform {
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
}`

export const LOCAL_VARIABLE_SCHEMAS = [
  { section: "general", name: "host",            label: "Host",            type: "string",   required: true,  is_sensitive: false, position: 0 },
  { section: "general", name: "user",            label: "User",            type: "string",   required: true,  is_sensitive: false, position: 1 },
  { section: "general", name: "ssh_password",    label: "SSH Password",    type: "secret",   required: false, is_sensitive: true,  position: 2 },
  { section: "general", name: "ssh_private_key", label: "SSH Private Key", type: "textarea", required: false, is_sensitive: true,  position: 3 },
] as const

export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
}
