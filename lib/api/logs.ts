import { request } from "./client"
import type { LogEntry, TerraformRun } from "./types"

export const TERRAFORM_RUN_SELECTOR = "__terraform_run__"

function inferLevel(line: string): LogEntry["level"] {
  const lower = line.toLowerCase()
  if (lower.includes("[error]") || lower.includes("error:") || lower.includes("failed")) return "error"
  if (lower.includes("[warning]") || lower.includes("warn:") || lower.includes("warning")) return "warning"
  if (lower.includes("[debug]") || lower.includes("debug:")) return "debug"
  return "info"
}

function parseTerraformLogs(run: TerraformRun): LogEntry[] {
  if (!run.logs) return []
  const ts = run.started_at ?? run.created_at ?? new Date().toISOString()
  return run.logs
    .split("\n")
    .filter(Boolean)
    .map((line, idx) => ({
      id: `tfrun-${run.id}-${idx}`,
      timestamp: ts,
      level: inferLevel(line),
      message: line,
      source: "terraform",
    }))
}

export const logsApi = {
  byInstance: (instanceId: string) => request<LogEntry[]>(`/instances/${instanceId}/logs`),

  terraformRunLogs: async (projectId: string, environmentId: string): Promise<LogEntry[]> => {
    const runs = await request<TerraformRun[]>(
      `/projects/${projectId}/environments/${environmentId}/terraform-runs`
    )
    if (!runs || runs.length === 0) return []
    const latest = runs[0]
    const run = await request<TerraformRun>(
      `/projects/${projectId}/environments/${environmentId}/terraform-runs/${latest.id}`
    )
    return parseTerraformLogs(run)
  },
}
