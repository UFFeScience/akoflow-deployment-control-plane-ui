import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { SchemaField } from "./schema-field"
import type { ProviderVariableSchema } from "@/lib/api/types"

interface SchemaFieldsSectionProps {
  sections: string[]
  grouped: Record<string, ProviderVariableSchema[]>
  values: Record<string, string>
  onValueChange: (field: string, value: string) => void
  isLoading: boolean
}

export function SchemaFieldsSection({
  sections,
  grouped,
  values,
  onValueChange,
  isLoading,
}: SchemaFieldsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This provider has no credential fields defined yet.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
            {section}
          </p>
          {grouped[section].map((schema) => (
            <div key={schema.name} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`field-${schema.name}`}>{schema.label}</Label>
                {schema.required && <span className="text-destructive text-xs">*</span>}
                {schema.is_sensitive && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-300">
                    sensitive
                  </Badge>
                )}
              </div>
              <SchemaField
                schema={schema}
                value={values[schema.name] ?? ""}
                onChange={(v) => onValueChange(schema.name, v)}
              />
              {schema.description && (
                <p className="text-xs text-muted-foreground">{schema.description}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
