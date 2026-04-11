"use client"

import { useState } from "react"
import { ListChecks, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SectionCard } from "@/components/templates/provider-config/section-card"
import { CredentialKeysEditor } from "@/components/templates/provider-config/credential-keys-editor"
import { PlaybookTasksEditor } from "@/components/templates/provider-config/playbook-tasks-editor"
import { PlaybookTriggerSelect } from "@/components/templates/playbook-trigger-select"
import type { TaskDraft } from "@/components/templates/provider-config/playbook-task-card"
import type { RunbookDraft } from "./types"

interface RunbookDraftCardProps {
  value: RunbookDraft
  onChange: (v: RunbookDraft) => void
  onDelete: () => void
}

export function RunbookDraftCard({ value, onChange, onDelete }: RunbookDraftCardProps) {
  const [tasks, setTasks] = useState<TaskDraft[]>([])

  return (
    <SectionCard
      title={value.name.trim() || "New Runbook"}
      icon={<ListChecks className="h-3.5 w-3.5 text-violet-500" />}
      badge={value.playbook_yaml.trim() ? "Configured" : undefined}
      defaultOpen={!value.playbook_yaml.trim()}
    >
      <PlaybookTriggerSelect
        value={value.trigger}
        onChange={(trigger) => onChange({ ...value, trigger })}
      />

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">Name</Label>
        <Input
          className="h-7 text-xs"
          placeholder="e.g. Restart Docker"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">
          Description <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        <Input
          className="h-7 text-xs"
          placeholder="What does this runbook do?"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">playbook.yml</Label>
        <PlaybookTasksEditor
          yaml={value.playbook_yaml}
          onYamlChange={(yaml) => onChange({ ...value, playbook_yaml: yaml })}
          tasks={tasks}
          onTasksChange={setTasks}
        />
      </div>

      <CredentialKeysEditor
        value={value.credential_env_keys}
        onChange={(keys) => onChange({ ...value, credential_env_keys: keys })}
        placeholder="SSH_PRIVATE_KEY"
      />

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">
          Playbook Roles <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          className="font-mono text-xs min-h-[50px] resize-y"
          placeholder={'[{"name": "geerlingguy.docker", "version": "6.1.0"}]'}
          value={value.roles_json}
          onChange={(e) => onChange({ ...value, roles_json: e.target.value })}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1.5"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </Button>
      </div>
    </SectionCard>
  )
}
