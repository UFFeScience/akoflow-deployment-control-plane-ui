"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SecretInput } from "@/components/common/secret-input"
import type { ProviderVariableSchema } from "@/lib/api/types"

interface SchemaFieldProps {
  schema: ProviderVariableSchema
  value: string
  onChange: (value: string) => void
}

export function SchemaField({ schema, value, onChange }: SchemaFieldProps) {
  const placeholder = schema.default_value ? `Default: ${schema.default_value}` : schema.label

  if (schema.type === "select" && schema.options) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${schema.label}`} />
        </SelectTrigger>
        <SelectContent>
          {schema.options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (schema.type === "textarea") {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="font-mono text-xs"
      />
    )
  }

  if (schema.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Switch checked={value === "true"} onCheckedChange={(v) => onChange(v ? "true" : "false")} />
        <span className="text-sm text-muted-foreground">{value === "true" ? "Enabled" : "Disabled"}</span>
      </div>
    )
  }

  if (schema.type === "secret") {
    return <SecretInput value={value} onChange={onChange} placeholder={placeholder} />
  }

  return (
    <Input
      type={schema.type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}
