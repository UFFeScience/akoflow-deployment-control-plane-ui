"use client"

import { useState } from "react"
import { Plus, Code2, Eye, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  parseOutputsMappingJson, outputsMappingToJson, defaultOutputsResource,
  type OutputsResource, type OutputsMapping,
} from "./outputs-mapping-editor/types"
import { ResourceCard } from "./outputs-mapping-editor/resource-card"

export type { OutputsResource, OutputsMapping } from "./outputs-mapping-editor/types"
export { defaultOutputsResource, parseOutputsMappingJson, outputsMappingToJson } from "./outputs-mapping-editor/types"

interface Props {
  value: string
  onChange: (raw: string) => void
}

export function OutputsMappingEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<"visual" | "raw">("visual")
  const parsed = parseOutputsMappingJson(value)

  const updateParsed = (updated: OutputsMapping) => onChange(outputsMappingToJson(updated))

  const patchResource = (index: number, partial: Partial<OutputsResource>) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    resources[index] = { ...resources[index], ...partial }
    updateParsed({ resources })
  }

  const patchOutputs = (index: number, partial: Partial<OutputsResource["outputs"]>) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    resources[index] = { ...resources[index], outputs: { ...resources[index].outputs, ...partial } }
    updateParsed({ resources })
  }

  const addResource = () => updateParsed({ resources: [...(parsed?.resources ?? []), defaultOutputsResource()] })

  const removeResource = (index: number) => {
    if (!parsed) return
    updateParsed({ resources: parsed.resources.filter((_, i) => i !== index) })
  }

  const addMetaField = (ri: number) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    resources[ri] = { ...resources[ri], outputs: { ...resources[ri].outputs, metadata: [...resources[ri].outputs.metadata, { key: "", tf_output: "" }] } }
    updateParsed({ resources })
  }

  const patchMetaField = (ri: number, mi: number, partial: Partial<{ key: string; tf_output: string }>) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    const metadata = [...resources[ri].outputs.metadata]
    metadata[mi] = { ...metadata[mi], ...partial }
    resources[ri] = { ...resources[ri], outputs: { ...resources[ri].outputs, metadata } }
    updateParsed({ resources })
  }

  const removeMetaField = (ri: number, mi: number) => {
    if (!parsed) return
    const resources = [...parsed.resources]
    resources[ri] = { ...resources[ri], outputs: { ...resources[ri].outputs, metadata: resources[ri].outputs.metadata.filter((_, i) => i !== mi) } }
    updateParsed({ resources })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setMode((m) => (m === "visual" ? "raw" : "visual"))}>
          {mode === "visual" ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {mode === "visual" ? "Raw JSON" : "Visual editor"}
        </button>
      </div>

      {mode === "raw" ? (
        <div className="flex flex-col gap-1">
          <Textarea value={value} onChange={(e) => onChange(e.target.value)}
            className="font-mono text-xs leading-relaxed min-h-[200px] resize-y bg-muted/20"
            spellCheck={false} placeholder='{ "resources": [] }' />
          {parsed === null && value.trim() && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />Invalid JSON
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(parsed?.resources ?? []).map((resource, ri) => (
            <ResourceCard key={ri} resource={resource} index={ri}
              onPatch={(p) => patchResource(ri, p)}
              onPatchOutputs={(p) => patchOutputs(ri, p)}
              onRemove={() => removeResource(ri)}
              onAddMeta={() => addMetaField(ri)}
              onPatchMeta={(mi, p) => patchMetaField(ri, mi, p)}
              onRemoveMeta={(mi) => removeMetaField(ri, mi)}
            />
          ))}
          {(parsed?.resources ?? []).length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No resources mapped yet. Add one to declare what AkoCloud should collect after provisioning.
            </div>
          )}
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-fit" onClick={addResource}>
            <Plus className="h-3.5 w-3.5" />Add Resource
          </Button>
        </div>
      )}
    </div>
  )
}
