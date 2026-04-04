"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { logsApi } from "@/lib/api/logs"
import { LogTerminal } from "./log-terminal"
import type { LogEntry } from "@/lib/api/types"

export type RunLogResource =
  | { type: "runbook"; projectId: string; environmentId: string; runId: string; title?: string }
  | { type: "ansible";  projectId: string; environmentId: string; runId: string; title?: string }

interface RunLogModalProps {
  open: boolean
  onClose: () => void
  resource: RunLogResource | null
}

export function RunLogModal({ open, onClose, resource }: RunLogModalProps) {
  const [entries, setEntries]   = useState<LogEntry[]>([])
  const [loading, setLoading]   = useState(false)
  const afterIdRef              = useRef<number | null>(null)
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollRef               = useRef<HTMLDivElement>(null)

  const fetchLogs = async (reset = false) => {
    if (!resource) return
    try {
      let newEntries: LogEntry[] = []

      if (resource.type === "runbook") {
        newEntries = await logsApi.runbookRunLogs(
          resource.projectId,
          resource.environmentId,
          resource.runId,
          reset ? null : afterIdRef.current,
        )
      } else {
        const result = await logsApi.ansibleRunLogs(
          resource.projectId,
          resource.environmentId,
          resource.runId,
          reset ? null : afterIdRef.current,
        )
        newEntries = result.entries
      }

      if (newEntries.length > 0) {
        afterIdRef.current = newEntries[newEntries.length - 1].id ?? null
        setEntries((prev) => reset ? newEntries : [...prev, ...newEntries])
      }
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    if (!open || !resource) {
      setEntries([])
      afterIdRef.current = null
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    setLoading(true)
    fetchLogs(true).finally(() => setLoading(false))

    intervalRef.current = setInterval(() => fetchLogs(false), 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [open, resource?.runId]) // eslint-disable-line

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  const terminalTitle = resource?.title
    ?? (resource?.type === "runbook" ? "Runbook Run · latest" : "Ansible Run · latest")

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 py-2.5 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-semibold">{terminalTitle}</DialogTitle>
        </DialogHeader>

        <LogTerminal
          title={terminalTitle}
          entries={entries}
          loading={loading}
          scrollRef={scrollRef}
          maxHeight="max-h-[500px]"
          minHeight="min-h-[240px]"
          emptyText="No log entries yet. Waiting for output…"
          footer={
            <>
              <span>{entries.length} line{entries.length !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
