"use client"

import { useState } from "react"
import { ListChecks, Loader2, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SectionCard } from "./section-card"
import { CredentialKeysEditor } from "./credential-keys-editor"
import { PlaybookTasksEditor } from "./playbook-tasks-editor"
import { TaskDraft } from "./playbook-task-card"
import { templatesApi } from "@/lib/api/templates"
import type { Runbook } from "@/lib/api/types"

interface RunbookCardProps {
  templateId: string
  versionId: string
  configId: string
  runbook: Runbook
  onUpdated: (r: Runbook) => void
  onDeleted: (id: string) => void
}

export function RunbookCard({ templateId, versionId, configId, runbook, onUpdated, onDeleted }: RunbookCardProps) {
  const [name, setName] = useState(runbook.name)
  const [description, setDescription] = useState(runbook.description ?? "")
  const [playbookYaml, setPlaybookYaml] = useState(runbook.playbook_yaml ?? "")
  const [tasks, setTasks] = useState<TaskDraft[]>([])
  const [credKeys, setCredKeys] = useState<string[]>(runbook.credential_env_keys ?? [])
  const [rolesJson, setRolesJson] = useState(
    runbook.roles_json ? JSON.stringify(runbook.roles_json, null, 2) : "[]"
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await templatesApi.updateRunbook(templateId, versionId, configId, runbook.id, {
        name: name.trim() || runbook.name,
        description: description || null,
        playbook_yaml: playbookYaml || null,
        credential_env_keys: credKeys,
        roles_json: (() => { try { return JSON.parse(rolesJson) } catch { return [] } })(),
      })
      onUpdated(updated)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await templatesApi.deleteRunbook(templateId, versionId, configId, runbook.id)
      onDeleted(runbook.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <SectionCard
      title={name || "Runbook"}
      icon={<ListChecks className="h-3.5 w-3.5 text-violet-500" />}
      badge={playbookYaml ? "Configured" : undefined}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">Name</Label>
        <Input className="h-7 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">
          Description <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        <Input className="h-7 text-xs" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">playbook.yml</Label>
        <PlaybookTasksEditor
          yaml={playbookYaml}
          onYamlChange={setPlaybookYaml}
          tasks={tasks}
          onTasksChange={setTasks}
        />
      </div>

      <CredentialKeysEditor value={credKeys} onChange={setCredKeys} placeholder="SSH_PRIVATE_KEY" />

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">
          Ansible Galaxy Roles <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          className="font-mono text-xs min-h-[60px] resize-y"
          placeholder={'[{"name": "geerlingguy.docker", "version": "6.1.0"}]'}
          value={rolesJson}
          onChange={(e) => setRolesJson(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleSave} disabled={saving || deleting}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </Button>
        <Button
          variant="ghost" size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1.5 ml-auto"
          onClick={handleDelete} disabled={saving || deleting}
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          Delete
        </Button>
      </div>
    </SectionCard>
  )
}
