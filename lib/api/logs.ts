import { request } from "./client"
import type { LogEntry } from "./types"

export const logsApi = {
  list: (params?: { experimentId?: string; instanceId?: string; level?: string; provider?: string }) =>
    request<LogEntry[]>(`/logs?${new URLSearchParams(params as Record<string, string>).toString()}`),
}
