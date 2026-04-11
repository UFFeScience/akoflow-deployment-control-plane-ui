"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, Save, Trash2, Zap, Terminal, ListChecks, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SectionCard } from "@/components/templates/provider-config/section-card"
import { CredentialKeysEditor } from "@/components/templates/provider-config/credential-keys-editor"
import { PlaybookTasksEditor } from "@/components/templates/provider-config/playbook-tasks-editor"
import type { TaskDraft } from "@/components/templates/provider-config/playbook-task-card"
import { templatesApi } from "@/lib/api/templates"
import type { Activity, ActivityTrigger } from "@/lib/api/types"

interface ActivityEditorProps {
  templateId: string
  versionId: string
  configId: string
  activity: Activity
  onUpdated: (a: Activity) => void
  onDeleted: (id: string) => void
}

const TRIGGER_META: Record<ActivityTrigger, { label: string; color: string; icon: React.ReactNode }> = {
  after_provision:  { label: "After Provision",  color: "text-green-500",  icon: <Terminal className="h-3.5 w-3.5 text-green-500" /> },
  when_ready:       { label: "When Ready",        color: "text-blue-500",   icon: <Zap className="h-3.5 w-3.5 text-blue-500" /> },
  manual:           { label: "On-Demand",         color: "text-violet-500", icon: <ListChecks className="h-3.5 w-3.5 text-violet-500" /> },
  before_teardown:  { label: "Before Teardown",   color: "text-orange-500", icon: <Clock className="h-3.5 w-3.5 text-orange-500" /> },
}

export function ActivityEditor({ templateId, versionId, configId, activity, onUpdated, onDeleted }: ActivityEditorProps) {
  const [name, setName]             = useState(activity.name)
  const [description, setDescription] = useState(activity.description ?? "")
  const [yaml, setYaml]             = useState(activity.playbook_yaml ?? "")
  const [credKeys, setCredKeys]     = useState<string[]>(activity.credential_env_keys ?? [])
  const [enabled, setEnabled]       = useState(activity.enabled ?? true)
  const [tasks, setTasks]           = useState<TaskDraft[]>(
    () => (activity.tasks ?? []).map((task, index) => ({
      name: task.name,
      module: task.module ?? undefined,
      when_condition: task.when_condition ?? undefined,
      become: task.become ?? false,
      enabled: task.enabled ?? true,
      position: task.position ?? index,
    })),
  )
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    setName(activity.name)
    setDescription(activity.description ?? "")
    setYaml(activity.playbook_yaml ?? "")
    setCredKeys(activity.credential_env_keys ?? [])
    setEnabled(activity.enabled ?? true)
    setTasks((activity.tasks ?? []).map((task, index) => ({
      name: task.name,
      module: task.module ?? undefined,
      when_condition: task.when_condition ?? undefined,
      become: task.become ?? false,
      enabled: task.enabled ?? true,
      position: task.position ?? index,
    })))
  }, [activity])

  const meta = TRIGGER_META[activity.trigger]

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await templatesApi.updatePlaybook(templateId, versionId, configId, activity.id, {
        name: name.trim() || activity.name,
        description: description || null,
        playbook_yaml: yaml || null,
        credential_env_keys: credKeys,
        enabled,
      })
      await templatesApi.syncPlaybookTasks(templateId, versionId, configId, activity.id, tasks)
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
      await templatesApi.deletePlaybook(templateId, versionId, configId, activity.id)
      onDeleted(activity.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <SectionCard
      title={name || "Activity"}
      icon={meta.icon}
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
        <Switch checked={enabled} onCheckedChange={setEnabled} id={`enabled-${activity.id}`} className="scale-75" />
        <Label htmlFor={`enabled-${activity.id}`} className="text-xs text-muted-foreground cursor-pointer">
          Enabled
        </Label>
      </div>

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
