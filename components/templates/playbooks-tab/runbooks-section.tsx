"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { templatesApi } from "@/lib/api/templates"
import type { ProviderConfiguration, Runbook } from "@/lib/api/types"
import { RunbookEditor } from "./runbook-editor"

interface RunbooksSectionProps {
  templateId: string
  versionId: string
  config: ProviderConfiguration
}

export function RunbooksSection({ templateId, versionId, config }: RunbooksSectionProps) {
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    templatesApi.listRunbooks(templateId, versionId, config.id)
      .then(setRunbooks)
      .finally(() => setLoading(false))
  }, [templateId, versionId, config.id])

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ListChecks className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-sm font-semibold">Runbooks</span>
        {runbooks.length > 0 && (
          <span className="rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 text-[10px] font-medium">
            {runbooks.length}
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground italic">on-demand playbooks</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {runbooks.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">No runbooks yet.</p>
          )}
          {runbooks.map((r) => (
            <RunbookEditor
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
            variant="outline" size="sm" className="h-7 text-xs gap-1.5"
            onClick={handleAdd} disabled={creating}
          >
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add Runbook
          </Button>
        </>
      )}
    </div>
  )
}
