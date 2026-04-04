"use client"

import { ListChecks, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type RunbookDraft, defaultRunbookDraft } from "./types"
import { RunbookDraftCard } from "./runbook-draft-card"

interface Props {
  runbooks: RunbookDraft[]
  setRunbooks: (v: RunbookDraft[]) => void
}

export function Step5PosConfig({ runbooks, setRunbooks }: Props) {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Pos Configuration &amp; Runbooks</h2>
        <p className="text-sm text-muted-foreground">
          Define runbooks — on-demand playbooks that can be triggered after the environment is provisioned.
          These are saved alongside the template and can be executed at any time from the environment panel.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {runbooks.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <ListChecks className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No runbooks defined. Add one below.</p>
          </div>
        )}

        {runbooks.map((rb, idx) => (
          <RunbookDraftCard
            key={rb._id}
            value={rb}
            onChange={(updated) => {
              const copy = [...runbooks]
              copy[idx] = updated
              setRunbooks(copy)
            }}
            onDelete={() => setRunbooks(runbooks.filter((_, i) => i !== idx))}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 w-fit"
          onClick={() => setRunbooks([...runbooks, defaultRunbookDraft()])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Runbook
        </Button>
      </div>
    </div>
  )
}
