"use client"

import { useState } from "react"
import { Code, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnsibleFlow } from "@/components/templates/topology-tab/ansible-flow"
import { parseAnsibleGraph } from "@/components/templates/topology-tab/parse-ansible"

interface PlaybookYamlViewerProps {
  yaml: string | null | undefined
  className?: string
}

export function PlaybookYamlViewer({ yaml, className }: PlaybookYamlViewerProps) {
  const [view, setView] = useState<"flow" | "yaml">("flow")

  if (!yaml?.trim()) {
    return (
      <span className="text-xs text-muted-foreground italic">No playbook YAML configured.</span>
    )
  }

  const graph = parseAnsibleGraph(yaml)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* View toggle */}
      <div className="flex items-center gap-1 self-end">
        <button
          type="button"
          onClick={() => setView("flow")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
            view === "flow" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <List className="h-3 w-3" />
          Tasks
        </button>
        <button
          type="button"
          onClick={() => setView("yaml")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
            view === "yaml" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Code className="h-3 w-3" />
          YAML
        </button>
      </div>

      {view === "flow" ? (
        graph && graph.tasks.length > 0 ? (
          <AnsibleFlow graph={graph} />
        ) : (
          <span className="text-xs text-muted-foreground italic">Could not parse playbook tasks.</span>
        )
      ) : (
        <pre className="rounded-lg border border-border bg-muted/30 p-3 text-[11px] font-mono leading-5 overflow-x-auto whitespace-pre-wrap break-all max-h-[320px] overflow-y-auto">
          {yaml}
        </pre>
      )}
    </div>
  )
}
