import { request } from "./client"
import type { LogEntry, TerraformRun, AnsibleRun } from "./types"

export const TERRAFORM_RUN_SELECTOR       = "__terraform_run__"
export const ANSIBLE_RUN_SELECTOR         = "__ansible_run__"
export const RUNBOOK_RUN_SELECTOR_PREFIX  = "__runbook_run__"
export const PLAYBOOK_RUN_SELECTOR_PREFIX = "__playbook_run__"
export const ACTIVITY_RUN_SELECTOR_PREFIX = PLAYBOOK_RUN_SELECTOR_PREFIX

export const makeRunbookRunSelector = (runId: string | number) =>
  `${RUNBOOK_RUN_SELECTOR_PREFIX}${runId}`
export const parseRunbookRunSelector = (s: string): string | null =>
  s.startsWith(RUNBOOK_RUN_SELECTOR_PREFIX) ? s.slice(RUNBOOK_RUN_SELECTOR_PREFIX.length) : null

export const makePlaybookRunSelector = (runId: string | number) =>
  `${PLAYBOOK_RUN_SELECTOR_PREFIX}${runId}`
export const parsePlaybookRunSelector = (s: string): string | null =>
  s.startsWith(PLAYBOOK_RUN_SELECTOR_PREFIX) ? s.slice(PLAYBOOK_RUN_SELECTOR_PREFIX.length) : null
export const makeActivityRunSelector = makePlaybookRunSelector
export const parseActivityRunSelector = parsePlaybookRunSelector

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

  /**
   * Fetch logs for the latest Ansible run of an environment.
   */
  ansibleRunLogs: async (
    projectId: string,
    environmentId: string,
    runId?: string | null,
    afterId?: number | null,
  ): Promise<{ entries: LogEntry[]; runId: string | null }> => {
    let resolvedRunId = runId ?? null

    if (!resolvedRunId) {
      const runs = await request<AnsibleRun[]>(
        `/projects/${projectId}/environments/${environmentId}/ansible-runs`
      )
      if (!runs || runs.length === 0) return { entries: [], runId: null }
      resolvedRunId = runs[0].id
    }

    const url = afterId
      ? `/projects/${projectId}/environments/${environmentId}/ansible-runs/${resolvedRunId}/logs?after_id=${afterId}`
      : `/projects/${projectId}/environments/${environmentId}/ansible-runs/${resolvedRunId}/logs`

    const raw = await request<RunLogApiEntry[]>(url)
    return { entries: raw.map(toLogEntry), runId: resolvedRunId }
  },

  /**
   * Fetch logs for a runbook run.
   */
  runbookRunLogs: async (
    projectId: string,
    environmentId: string,
    runId: string,
    afterId?: number | null,
  ): Promise<LogEntry[]> => {
    const url = afterId
      ? `/projects/${projectId}/environments/${environmentId}/playbook-runs/${runId}/logs?after_id=${afterId}`
      : `/projects/${projectId}/environments/${environmentId}/playbook-runs/${runId}/logs`
    const raw = await request<RunLogApiEntry[]>(url)
    return raw.map(toLogEntry)
  },

  /**
   * Fetch logs for a playbook run.
   */
  playbookRunLogs: async (
    projectId: string,
    environmentId: string,
    runId: string,
    afterId?: number | null,
  ): Promise<LogEntry[]> => {
    const url = afterId
      ? `/projects/${projectId}/environments/${environmentId}/playbook-runs/${runId}/logs?after_id=${afterId}`
      : `/projects/${projectId}/environments/${environmentId}/playbook-runs/${runId}/logs`
    const raw = await request<RunLogApiEntry[]>(url)
    return raw.map(toLogEntry)
  },

  activityRunLogs: async (
    projectId: string,
    environmentId: string,
    runId: string,
    afterId?: number | null,
  ): Promise<LogEntry[]> => logsApi.playbookRunLogs(projectId, environmentId, runId, afterId),
}
