import { request } from "./client"
import type { LogEntry, TerraformRun } from "./types"

export const TERRAFORM_RUN_SELECTOR = "__terraform_run__"

// ── API shape returned by the new /logs endpoints ────────────────────────────

interface RunLogApiEntry {
  id: number
  terraform_run_id: string | null
  provisioned_resource_id: string | null
  environment_id: string | null
  source: string
  level: string
  message: string
  created_at: string
}

function normalizeLevel(level: string): LogEntry["level"] {
  switch (level.toUpperCase()) {
    case "ERROR":   return "error"
    case "WARN":    return "warning"
    case "WARNING": return "warning"
    case "DEBUG":   return "debug"
    default:        return "info"
  }
}

function toLogEntry(e: RunLogApiEntry): LogEntry {
  return {
    id:                      e.id,
    terraform_run_id:        e.terraform_run_id,
    provisioned_resource_id: e.provisioned_resource_id,
    environment_id:          e.environment_id,
    source:                  e.source,
    level:                   normalizeLevel(e.level),
    message:                 e.message,
    timestamp:               e.created_at,
    created_at:              e.created_at,
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export const logsApi = {
  /**
   * Fetch logs for a provisioned resource.
   * Pass afterId to fetch only rows newer than that id (incremental polling).
   */
  byResource: async (resourceId: string, afterId?: number | null): Promise<LogEntry[]> => {
    const url = afterId
      ? `/resources/${resourceId}/logs?after_id=${afterId}`
      : `/resources/${resourceId}/logs`
    const data = await request<RunLogApiEntry[]>(url)
    return data.map(toLogEntry)
  },

  /**
   * Fetch logs for the latest terraform run of an environment.
   * Pass runId to reuse an already-resolved run (avoids extra list request on polls).
   * Pass afterId to fetch only rows newer than that id (incremental polling).
   */
  terraformRunLogs: async (
    projectId: string,
    environmentId: string,
    runId?: string | null,
    afterId?: number | null,
  ): Promise<{ entries: LogEntry[]; runId: string | null }> => {
    let resolvedRunId = runId ?? null

    if (!resolvedRunId) {
      const runs = await request<TerraformRun[]>(
        `/projects/${projectId}/environments/${environmentId}/terraform-runs`
      )
      if (!runs || runs.length === 0) return { entries: [], runId: null }
      resolvedRunId = runs[0].id
    }

    const url = afterId
      ? `/projects/${projectId}/environments/${environmentId}/terraform-runs/${resolvedRunId}/logs?after_id=${afterId}`
      : `/projects/${projectId}/environments/${environmentId}/terraform-runs/${resolvedRunId}/logs`

    const data = await request<RunLogApiEntry[]>(url)
    return { entries: data.map(toLogEntry), runId: resolvedRunId }
  },
}

