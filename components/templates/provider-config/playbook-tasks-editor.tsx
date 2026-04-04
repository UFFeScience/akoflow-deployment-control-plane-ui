"use client"

import { useState, useEffect } from "react"
import { Plus, List, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PlaybookTaskCard } from "./playbook-task-card"
import type { TaskDraft } from "./playbook-task-card"
import { parseAnsibleGraph } from "@/components/templates/topology-tab/parse-ansible"

interface PlaybookTasksEditorProps {
  yaml: string
  onYamlChange: (yaml: string) => void
  tasks: TaskDraft[]
  onTasksChange: (tasks: TaskDraft[]) => void
}

export function PlaybookTasksEditor({ yaml, onYamlChange, tasks, onTasksChange }: PlaybookTasksEditorProps) {
  const [view, setView] = useState<"cards" | "yaml">("cards")

  // Auto-parse YAML → tasks on first render when tasks are empty but yaml has content
  useEffect(() => {
    if (tasks.length > 0 || !yaml?.trim()) return
    const graph = parseAnsibleGraph(yaml)
    if (graph?.tasks.length) {
      onTasksChange(
        graph.tasks.map((t, i) => ({ name: t.name, module: t.module, position: i, enabled: true }))
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Always re-parse YAML → tasks when switching to cards view
  const handleSwitchToCards = () => {
    const graph = parseAnsibleGraph(yaml)
    if (graph?.tasks.length) {
      onTasksChange(
        graph.tasks.map((t, i) => ({ name: t.name, module: t.module, position: i, enabled: true }))
      )
    }
    setView("cards")
  }

  const updateTask = (index: number, updated: TaskDraft) => {
    onTasksChange(tasks.map((t, i) => (i === index ? updated : t)))
  }

  const removeTask = (index: number) => {
    onTasksChange(tasks.filter((_, i) => i !== index).map((t, i) => ({ ...t, position: i })))
  }

  const addTask = () => {
    onTasksChange([...tasks, { name: "", position: tasks.length, enabled: true }])
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 self-end">
        <button
          type="button"
          onClick={() => setView("yaml")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
            view === "yaml" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Code className="h-3 w-3" />YAML
        </button>
        <button
          type="button"
          onClick={handleSwitchToCards}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
            view === "cards" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <List className="h-3 w-3" />Tasks
        </button>
      </div>

      {view === "yaml" && (
        <Textarea
          className="font-mono text-xs min-h-[160px] resize-y"
          placeholder={"- hosts: all\n  become: yes\n  tasks:\n    - name: Install Docker\n      apt:\n        name: docker.io"}
          value={yaml}
          onChange={(e) => onYamlChange(e.target.value)}
        />
      )}

      {view === "cards" && (
        <div className="flex flex-col gap-1.5">
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              No tasks yet. Add tasks below or switch to YAML view.
            </p>
          )}
          {tasks.map((task, i) => (
            <PlaybookTaskCard
              key={i}
              task={task}
              index={i}
              onChange={(updated) => updateTask(i, updated)}
              onRemove={() => removeTask(i)}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 w-full mt-1"
            onClick={addTask}
          >
            <Plus className="h-3.5 w-3.5" />Add task
          </Button>
        </div>
      )}
    </div>
  )
}
