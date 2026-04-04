"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, Save, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/components/templates/provider-config/section-card"
import { CredentialKeysEditor } from "@/components/templates/provider-config/credential-keys-editor"
import { PlaybookTasksEditor } from "@/components/templates/provider-config/playbook-tasks-editor"
import type { TaskDraft } from "@/components/templates/provider-config/playbook-task-card"
import { templatesApi } from "@/lib/api/templates"
import type { ProviderConfiguration } from "@/lib/api/types"

interface ConfigPlaybookSectionProps {
  templateId: string
  versionId: string
  config: ProviderConfiguration
}

export function ConfigPlaybookSection({ templateId, versionId, config }: ConfigPlaybookSectionProps) {
  const [yaml, setYaml] = useState(config.ansible_playbook?.playbook_yaml ?? "")
  const [credKeys, setCredKeys] = useState<string[]>(config.ansible_playbook?.credential_env_keys ?? [])
  const [tasks, setTasks] = useState<TaskDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await templatesApi.upsertProviderConfigAnsible(templateId, versionId, config.id, {
        playbook_yaml: yaml || undefined,
        credential_env_keys: credKeys,
      })
      if (tasks.length > 0) {
        await templatesApi.syncPlaybookTasks(templateId, versionId, config.id, tasks)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard
      title="Configure Playbook"
      icon={<Terminal className="h-3.5 w-3.5 text-green-500" />}
      badge={config.ansible_playbook?.has_custom_playbook ? "Configured" : undefined}
      hint="ansible"
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">
          playbook.yml <span className="font-normal text-muted-foreground">+ tasks</span>
        </Label>
        <PlaybookTasksEditor
          yaml={yaml}
          onYamlChange={setYaml}
          tasks={tasks}
          onTasksChange={setTasks}
        />
      </div>

      <CredentialKeysEditor value={credKeys} onChange={setCredKeys} placeholder="SSH_PRIVATE_KEY" />

      <div className="flex items-center gap-3">
        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />Saved
          </span>
        )}
      </div>
    </SectionCard>
  )
}
