"use client"

import { cn } from "@/lib/utils"
import { Terminal } from "lucide-react"
import type { AnsibleGraph } from "./parse-ansible"

export function AnsibleFlow({ graph, className }: { graph: AnsibleGraph; className?: string }) {
  return (
    <div className={cn("flex flex-col max-w-lg", className)}>
      <div className="rounded-t-lg border border-border bg-muted/30 px-3 py-2 flex items-center gap-2 flex-wrap">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium truncate flex-1">{graph.play || "Playbook"}</span>
        <span className="text-[10px] text-muted-foreground font-mono">hosts: {graph.hosts || "all"}</span>
        {graph.become && (
          <span className="text-[10px] font-medium rounded border border-amber-400/30 bg-amber-500/5 text-amber-600 px-1 py-0.5">
            become
          </span>
        )}
      </div>

      {graph.tasks.map((task, i) => {
        const isLast = i === graph.tasks.length - 1
        return (
          <div key={i} className="relative flex">
            <div className="flex flex-col items-center w-10 shrink-0">
              <div className="w-px bg-border flex-1 min-h-[10px]" />
              <div className="flex items-center justify-center w-5 h-5 rounded-full border border-border bg-background text-[9px] font-bold text-muted-foreground shrink-0 z-10">
                {i + 1}
              </div>
              {!isLast && <div className="w-px bg-border flex-1 min-h-[10px]" />}
            </div>
            <div className={cn(
              "flex-1 border-r border-b border-border px-3 py-2 flex flex-col gap-0.5",
              i === 0 ? "border-t" : "",
              isLast ? "rounded-br-lg" : "",
            )}>
              <span className="text-xs font-medium leading-snug">{task.name}</span>
              {task.module && (
                <span className="inline-flex items-center text-[10px] font-mono text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mr-1.5 shrink-0" />
                  {task.module}
                </span>
              )}
            </div>
          </div>
        )
      })}

      <div className="rounded-b-lg border border-t-0 border-border bg-muted/10 px-3 py-1.5">
        <span className="text-[10px] text-muted-foreground">
          {graph.tasks.length} task{graph.tasks.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}
