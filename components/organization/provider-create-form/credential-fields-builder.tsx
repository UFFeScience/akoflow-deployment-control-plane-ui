import { useState } from "react"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { emptyRow, type SchemaRow } from "./types"
import { SchemaRowEditor } from "./schema-row-editor"

interface Props {
  rows: SchemaRow[]
  onChange: (rows: SchemaRow[]) => void
}

export function CredentialFieldsBuilder({ rows, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const updateRow = (key: string, patch: Partial<SchemaRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const removeRow = (key: string) => onChange(rows.filter((r) => r.key !== key))

  return (
    <div className="rounded-md border border-border">
      <button type="button"
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((o) => !o)}>
        <span className="flex items-center gap-2">
          Credential Fields
          {rows.length > 0 && <Badge variant="secondary" className="text-xs">{rows.length}</Badge>}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-border p-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Define the fields that will appear when creating credentials for this provider.
          </p>
          {rows.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-3">No fields yet. Add one below.</p>
          )}
          {rows.map((row) => (
            <SchemaRowEditor key={row.key} row={row} onUpdate={(p) => updateRow(row.key, p)} onRemove={() => removeRow(row.key)} />
          ))}
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onChange([...rows, emptyRow()])}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add Field
          </Button>
        </div>
      )}
    </div>
  )
}
