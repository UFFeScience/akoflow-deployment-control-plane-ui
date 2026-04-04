"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RunbookCard } from "./runbook-card"
import { templatesApi } from "@/lib/api/templates"
import type { Runbook, ProviderConfiguration } from "@/lib/api/types"

interface RunbookSectionProps {
  templateId: string
  versionId: string
  config: ProviderConfiguration
}

export function RunbookSection({ templateId, versionId, config }: RunbookSectionProps) {
  const [runbooks, setRunbooks] = useState<Runbook[]>(config.runbooks ?? [])
  const [loading, setLoading] = useState(!config.runbooks)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (config.runbooks) return
    templatesApi.listRunbooks(templateId, versionId, config.id)
      .then(setRunbooks)
      .finally(() => setLoading(false))
  }, [templateId, versionId, config.id, config.runbooks])

  const handleAdd = async () => {
    setCreating(true)
    try {
      const r = await templatesApi.createRunbook(templateId, versionId, config.id, {
        name: `Runbook ${runbooks.length + 1}`,
        position: runbooks.length,
      })
      setRunbooks((prev) => [...prev, r])
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
        <ListChecks className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-sm font-semibold">Runbooks</span>
        {runbooks.length > 0 && (
          <span className="rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 text-[10px] font-medium">
            {runbooks.length}
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground font-normal italic">on-demand playbooks</span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {loading && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && runbooks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No runbooks yet. Add one to enable on-demand execution.
          </p>
        )}

        {runbooks.map((r) => (
          <RunbookCard
            key={r.id}
            templateId={templateId}
            versionId={versionId}
            configId={config.id}
            runbook={r}
            onUpdated={(updated) => setRunbooks((prev) => prev.map((rb) => rb.id === updated.id ? updated : rb))}
            onDeleted={(id) => setRunbooks((prev) => prev.filter((rb) => rb.id !== id))}
          />
        ))}

        <Button
          variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full"
          onClick={handleAdd} disabled={creating || loading}
        >
          {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add Runbook
        </Button>
      </div>
    </div>
  )
}
