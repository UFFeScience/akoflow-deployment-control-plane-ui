import { ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnsibleTask, AnsibleTaskStatus } from "@/components/templates/topology-tab/parse-ansible"
import { TaskStatusIcon } from "./task-status-icon"

function taskStatusClass(status: AnsibleTaskStatus): string {
  if (status === "running") return "bg-blue-50 dark:bg-blue-950/30"
  if (status === "ok")      return "bg-emerald-50 dark:bg-emerald-950/30"
  if (status === "changed") return "bg-amber-50 dark:bg-amber-950/30"
  if (status === "failed")  return "bg-red-50 dark:bg-red-950/30"
  return ""
}

interface TasksListProps {
  tasks: AnsibleTask[]
  taskStatuses?: Record<string, AnsibleTaskStatus>
}

export function TasksList({ tasks, taskStatuses }: TasksListProps) {
  if (tasks.length === 0) return null

  return (
    <div className="mt-1 rounded-md border border-border/60 bg-muted/20 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/60 bg-muted/30">
        <ListChecks className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Configuration tasks ({tasks.length})
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {tasks.map((task, i) => {
          const status = taskStatuses?.[task.name] ?? "pending"
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 transition-colors",
                taskStatusClass(status),
              )}
            >
              <TaskStatusIcon status={status} />
              <span className="text-[11px] text-foreground flex-1 leading-snug">{task.name}</span>
              {task.module && (
                <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted px-1 rounded">
                  {task.module}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
