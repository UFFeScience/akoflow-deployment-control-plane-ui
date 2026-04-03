import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProviderVariableSchema } from "@/lib/api/types"
import { FIELD_TYPES, type SchemaRow } from "./types"

interface Props {
  row: SchemaRow
  onUpdate: (patch: Partial<SchemaRow>) => void
  onRemove: () => void
}

export function SchemaRowEditor({ row, onUpdate, onRemove }: Props) {
  return (
    <div className="rounded-md border border-border p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Name (key) *</Label>
          <Input value={row.name} onChange={(e) => onUpdate({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder="e.g. api_key" className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Label *</Label>
          <Input value={row.label} onChange={(e) => onUpdate({ label: e.target.value })} placeholder="e.g. API Key" className="h-7 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Type *</Label>
          <Select value={row.type} onValueChange={(v) => onUpdate({ type: v as ProviderVariableSchema["type"] })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Section</Label>
          <Input value={row.section} onChange={(e) => onUpdate({ section: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder="general" className="h-7 text-xs" />
        </div>
      </div>

      {row.type === "select" && (
        <div className="space-y-1">
          <Label className="text-xs">Options (comma-separated)</Label>
          <Input value={row.options_raw} onChange={(e) => onUpdate({ options_raw: e.target.value })} placeholder="option1, option2, option3" className="h-7 text-xs" />
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Default value</Label>
        <Input value={row.default_value} onChange={(e) => onUpdate({ default_value: e.target.value })} className="h-7 text-xs" placeholder="Optional" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Switch checked={row.required} onCheckedChange={(v) => onUpdate({ required: v })} className="scale-75" />Required
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Switch checked={row.is_sensitive} onCheckedChange={(v) => onUpdate({ is_sensitive: v })} className="scale-75" />Sensitive
          </label>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
