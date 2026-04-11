"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Terminal, Zap, ListChecks, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { templatesApi } from "@/lib/api/templates"
import type { Activity, ActivityTrigger, ProviderConfiguration } from "@/lib/api/types"
import { ActivityEditor } from "./activity-editor"

interface ActivitiesSectionProps {
  templateId: string
  versionId: string
  config: ProviderConfiguration
}

const TRIGGER_OPTIONS: { value: ActivityTrigger; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "after_provision",
    label: "After Provision",
    description: "Runs automatically after Terraform apply succeeds",
    icon: <Terminal className="h-3.5 w-3.5 text-green-500" />,
  },
  {
    value: "when_ready",
    label: "When Ready",
    description: "Runs automatically once all after_provision activities complete",
    icon: <Zap className="h-3.5 w-3.5 text-blue-500" />,
  },
  {
    value: "manual",
    label: "On-Demand",
    description: "Triggered manually by the user",
    icon: <ListChecks className="h-3.5 w-3.5 text-violet-500" />,
  },
  {
    value: "before_teardown",
    label: "Before Teardown",
    description: "Runs automatically before Terraform destroy",
    icon: <Clock className="h-3.5 w-3.5 text-orange-500" />,
  },
]

function TriggerGroup({
  trigger,
  activities,
  templateId,
  versionId,
  configId,
  onUpdated,
  onDeleted,
}: {
  trigger: typeof TRIGGER_OPTIONS[number]
  activities: Activity[]
  templateId: string
  versionId: string
  configId: string
  onUpdated: (a: Activity) => void
  onDeleted: (id: string) => void
}) {
  if (activities.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 border-b border-border pb-1.5">
        {trigger.icon}
        <span className="text-xs font-semibold">{trigger.label}</span>
        <span className="text-[10px] text-muted-foreground">— {trigger.description}</span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {activities.length}
        </span>
      </div>
      {activities.map((a) => (
        <ActivityEditor
          key={a.id}
          templateId={templateId}
          versionId={versionId}
          configId={configId}
          activity={a}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  )
}

export function ActivitiesSection({ templateId, versionId, config }: ActivitiesSectionProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTrigger, setNewTrigger] = useState<ActivityTrigger>("after_provision")

  useEffect(() => {
    templatesApi.listPlaybooks(templateId, versionId, config.id)
      .then(setActivities)
      .finally(() => setLoading(false))
  }, [templateId, versionId, config.id])

  const handleAdd = async () => {
    setCreating(true)
    try {
      const byTrigger = activities.filter((a) => a.trigger === newTrigger)
      const a = await templatesApi.createPlaybook(templateId, versionId, config.id, {
        name: `Activity ${activities.length + 1}`,
        trigger: newTrigger,
        position: byTrigger.length,
        enabled: true,
      })
      setActivities((prev) => [...prev, a])
    } finally {
      setCreating(false)
    }
  }

  const byTrigger = (t: ActivityTrigger) =>
    activities
      .filter((a) => a.trigger === t)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activities.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">No activities yet. Add one below.</p>
          )}

          {TRIGGER_OPTIONS.map((t) => (
            <TriggerGroup
              key={t.value}
              trigger={t}
              activities={byTrigger(t.value)}
              templateId={templateId}
              versionId={versionId}
              configId={config.id}
              onUpdated={(updated) =>
                setActivities((prev) => prev.map((a) => a.id === updated.id ? updated : a))
              }
              onDeleted={(id) =>
                setActivities((prev) => prev.filter((a) => a.id !== id))
              }
            />
          ))}

          <div className="flex items-center gap-2 pt-1">
            <Select value={newTrigger} onValueChange={(v) => setNewTrigger(v as ActivityTrigger)}>
              <SelectTrigger className="h-7 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline" size="sm" className="h-7 text-xs gap-1.5"
              onClick={handleAdd} disabled={creating}
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add Activity
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
