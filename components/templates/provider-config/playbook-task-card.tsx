"use client"

import { useState } from "react"
import { Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface TaskDraft {
  name: string
  module?: string
  when_condition?: string
  become?: boolean
  position: number
  enabled?: boolean
}

interface PlaybookTaskCardProps {
  task: TaskDraft
  index: number
  onChange: (t: TaskDraft) => void
  onRemove: () => void
}

export function PlaybookTaskCard({ task, index, onChange, onRemove }: PlaybookTaskCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 cursor-grab" />
        <span className="text-[10px] text-muted-foreground/60 w-4 shrink-0 font-mono">{index + 1}</span>
        <button
          type="button"
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          {open
            ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-medium truncate">{task.name || <span className="italic text-muted-foreground">unnamed task</span>}</span>
          {task.module && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 shrink-0 font-mono">{task.module}</Badge>
          )}
        </button>
        <button
          type="button"
          className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-border/50">
          <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Name</label>
              <Input
                className="h-6 text-xs"
                value={task.name}
                onChange={(e) => onChange({ ...task, name: e.target.value })}
                placeholder="Install Docker"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Module</label>
              <Input
                className="h-6 text-xs w-28 font-mono"
                value={task.module ?? ""}
                onChange={(e) => onChange({ ...task, module: e.target.value || undefined })}
                placeholder="apt"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">When condition <span className="opacity-60">optional</span></label>
            <Input
              className="h-6 text-xs font-mono"
              value={task.when_condition ?? ""}
              onChange={(e) => onChange({ ...task, when_condition: e.target.value || undefined })}
              placeholder="ansible_os_family == 'Debian'"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                task.become
                  ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700"
                  : "border-border text-muted-foreground hover:border-foreground/30",
              )}
              onClick={() => onChange({ ...task, become: !task.become })}
            >
              sudo / become {task.become ? "on" : "off"}
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                task.enabled !== false
                  ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                  : "border-border text-muted-foreground hover:border-foreground/30",
              )}
              onClick={() => onChange({ ...task, enabled: !(task.enabled !== false) })}
            >
              {task.enabled !== false ? "enabled" : "disabled"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
