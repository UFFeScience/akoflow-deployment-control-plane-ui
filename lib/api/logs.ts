import { request } from "./client"
import type { LogEntry } from "./types"

export const logsApi = {
  byInstance: (instanceId: string) => request<LogEntry[]>(`/instances/${instanceId}/logs`),
}
