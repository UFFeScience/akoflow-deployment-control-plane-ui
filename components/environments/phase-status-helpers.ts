import type { AnsibleRun, TerraformRun } from "@/lib/api/types"

export type PhaseStatus = "idle" | "running" | "success" | "error"

export function terraformPhaseStatus(deploymentStatus: string, tfRun?: TerraformRun | null): PhaseStatus {
  const ds = deploymentStatus.toLowerCase()
  if (tfRun) {
    const s = tfRun.status.toLowerCase()
    if (s === "applied") return "success"
    if (s === "failed")  return "error"
    if (["initializing", "planning", "applying"].includes(s)) return "running"
  }
  if (ds === "provisioning") return "running"
  if (ds === "configuring" || ds === "running") return "success"
  if (ds === "error") {
    if (!tfRun || tfRun.status.toLowerCase() === "failed") return "error"
    return "success"
  }
  return "idle"
}

export function ansiblePhaseStatus(deploymentStatus: string, ansibleRun?: AnsibleRun | null): PhaseStatus {
  const ds = deploymentStatus.toLowerCase()
  if (ansibleRun) {
    const s = ansibleRun.status.toLowerCase()
    if (s === "completed") return "success"
    if (s === "failed")    return "error"
    if (["initializing", "running"].includes(s)) return "running"
  }
  if (ds === "configuring") return "running"
  if (ds === "running")     return "success"
  if (ds === "error") {
    if (ansibleRun && ansibleRun.status.toLowerCase() === "failed") return "error"
    return "idle"
  }
  return "idle"
}

export function teardownPhaseStatus(_deploymentStatus: string, teardownRun?: AnsibleRun | null): PhaseStatus {
  if (!teardownRun) return "idle"
  const s = teardownRun.status.toLowerCase()
  if (s === "completed") return "success"
  if (s === "failed")    return "error"
  if (["initializing", "running"].includes(s)) return "running"
  return "idle"
}

export function destroyPhaseStatus(deploymentStatus: string, destroyTfRun?: TerraformRun | null): PhaseStatus {
  if (destroyTfRun) {
    const s = destroyTfRun.status.toLowerCase()
    if (s === "destroyed") return "success"
    if (s === "failed")    return "error"
    if (s === "destroying") return "running"
  }
  if (deploymentStatus.toLowerCase() === "stopped") return "success"
  return "idle"
}
