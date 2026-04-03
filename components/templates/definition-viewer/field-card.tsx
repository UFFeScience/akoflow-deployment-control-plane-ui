import { Type } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FormField } from "@/lib/api/types"
import { FIELD_TYPE_ICON, FIELD_TYPE_COLOR } from "./constants"

export function FieldCard({ field }: { field: FormField }) {
  const icon  = FIELD_TYPE_ICON[field.type] ?? <Type className="h-3 w-3" />
  const color = FIELD_TYPE_COLOR[field.type] ?? "text-muted-foreground"
  return (
    <div className="rounded border border-border bg-background p-2.5 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("shrink-0", color)}>{icon}</span>
          <span className="text-xs font-medium truncate">{field.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {field.required && <span className="rounded bg-red-500/10 text-red-500 border border-red-500/20 px-1 py-0.5 text-[10px]">required</span>}
          <span className="rounded bg-muted text-muted-foreground px-1 py-0.5 text-[10px] font-mono">{field.type}</span>
        </div>
      </div>
      <code className="text-[10px] text-muted-foreground font-mono">{field.name}</code>
      {field.description && <p className="text-[11px] text-muted-foreground leading-relaxed">{field.description}</p>}
      {field.default !== undefined && field.default !== "" && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="font-medium">Default:</span><code className="font-mono">{String(field.default)}</code>
        </div>
      )}
      {field.options && field.options.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {field.options.map((opt) => <span key={opt.value} className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">{opt.label}</span>)}
        </div>
      )}
    </div>
  )
}

export function FieldRow({ field }: { field: FormField }) {
  const icon  = FIELD_TYPE_ICON[field.type] ?? <Type className="h-3 w-3" />
  const color = FIELD_TYPE_COLOR[field.type] ?? "text-muted-foreground"
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs">
      <span className={cn("shrink-0", color)}>{icon}</span>
      <span className="font-medium truncate">{field.label}</span>
      <code className="text-[10px] text-muted-foreground font-mono">{field.name}</code>
      {field.required && <span className="rounded bg-red-500/10 text-red-500 border border-red-500/20 px-1 py-0.5 text-[10px]">req</span>}
      <span className="rounded bg-muted text-muted-foreground px-1 py-0.5 text-[10px] font-mono ml-auto">{field.type}</span>
    </div>
  )
}
