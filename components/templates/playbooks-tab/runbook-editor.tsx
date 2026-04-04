"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, Save, Trash2, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/components/templates/provider-config/section-card"
import { CredentialKeysEditor } from "@/components/templates/provider-config/credential-keys-editor"
import { PlaybookTasksEditor } from "@/components/templates/provider-config/playbook-tasks-editor"
import type { TaskDraft } from "@/components/templates/provider-config/playbook-task-card"
import { templatesApi } from "@/lib/api/templates"
import type { Runbook } from "@/lib/api/types"

interface RunbookEditorProps {
  templateId: string
  versionId: string
  configId: string
  runbook: Runbook
  onUpdated: (r: Runbook) => void
  onDeleted: (id: string) => void
}

export function RunbookEditor({ templateId, versionId, configId, runbook, onUpdated, onDeleted }: RunbookEditorProps) {
  const [name, setName] = useState(runbook.name)
  const [description, setDescription] = useState(runbook.description ?? "")
  const [yaml, setYaml] = useState(runbook.playbook_yaml ?? "")
  const [credKeys, setCredKeys] = useState<string[]>(runbook.credential_env_keys ?? [])
  const [tasks, setTasks] = useState<TaskDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await templatesApi.updateRunbook(templateId, versionId, configId, runbook.id, {
        name: name.trim() || runbook.name,
        description: description || null,
        playbook_yaml: yaml || null,
        credential_env_keys: credKeys,
      })
      if (tasks.length > 0) {
        await templatesApi.syncRunbookTasks(templateId, versionId, configId, runbook.id, tasks)
      }
      onUpdated(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
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
      badge={yaml ? "Configured" : undefined}
      defaultOpen={false}
    >
      <div className="grid grid-cols-[1fr_1fr] gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold">Name</Label>
          <Input className="h-7 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold">
            Description <span className="font-normal text-muted-foreground">optional</span>
          </Label>
          <Input className="h-7 text-xs" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">
          playbook.yml <span className="font-normal text-muted-foreground">+ tasks</span>
        </Label>
        <PlaybookTasksEditor yaml={yaml} onYamlChange={setYaml} tasks={tasks} onTasksChange={setTasks} />
      </div>

      <CredentialKeysEditor value={credKeys} onChange={setCredKeys} placeholder="SSH_PRIVATE_KEY" />

      <div className="flex items-center gap-2">
        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleSave} disabled={saving || deleting}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />Saved
          </span>
        )}
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
