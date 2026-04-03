"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface MappingEditorProps {
  label: string
  placeholder: string
  jsonValue: string
  onJsonChange: (raw: string) => void
  expFields: { name: string; label: string }[]
  section: string
}

export function MappingEditor({ label, placeholder, jsonValue, onJsonChange, expFields, section }: MappingEditorProps) {
  if (expFields.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">{label}</Label>
        <Textarea className="font-mono text-xs min-h-[80px] resize-y" value={jsonValue}
          onChange={(e) => onJsonChange(e.target.value)} />
      </div>
    )
  }

  let mapping: Record<string, string> = {}
  try { mapping = JSON.parse(jsonValue)?.[section] ?? {} } catch { /* ignore */ }

  const updateField = (fieldName: string, varName: string) => {
    let m: Record<string, unknown> = {}
    try { m = JSON.parse(jsonValue) } catch { /* ignore */ }
    const s = (m[section] as Record<string, string>) ?? {}
    s[fieldName] = varName
    m[section] = s
    onJsonChange(JSON.stringify(m, null, 2))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr] gap-x-2 px-3 py-1.5 bg-muted/30 text-[11px] text-muted-foreground">
          <span>definition field</span><span>{placeholder}</span>
        </div>
        {expFields.map((f) => (
          <div key={f.name} className="grid grid-cols-[1fr_1fr] gap-x-2 px-3 py-1 border-t border-border/50 items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium">{f.label}</span>
              <code className="text-[10px] text-muted-foreground">{f.name}</code>
            </div>
            <Input className="h-6 text-xs font-mono" value={mapping[f.name] ?? ""} placeholder={placeholder}
              onChange={(e) => updateField(f.name, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  )
}
