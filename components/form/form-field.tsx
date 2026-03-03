"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import type { FormField } from "@/lib/api/types"

interface FormFieldComponentProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
}

export function FormFieldComponent({ field, value, onChange, error }: FormFieldComponentProps) {
  const handleChange = (newValue: unknown) => {
    onChange(newValue)
  }

  const stringValue = String(value ?? field.default ?? "")
  const numberValue = Number(value ?? field.default ?? 0)
  const boolValue = Boolean(value ?? field.default ?? false)

  switch (field.type) {
    case "string":
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            className={`h-9 text-sm ${error ? "border-red-500" : ""}`}
            placeholder={field.default ? String(field.default) : `Enter ${field.label.toLowerCase()}`}
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={field.maxLength}
          />
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
      )

    case "number":
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            type="number"
            className={`h-9 text-sm ${error ? "border-red-500" : ""}`}
            placeholder={field.default ? String(field.default) : "0"}
            value={numberValue}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : "")}
            min={field.min}
            max={field.max}
            step={field.step}
          />
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
      )

    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={field.name}
            checked={boolValue}
            onCheckedChange={(checked) => handleChange(checked)}
          />
          <Label htmlFor={field.name} className="text-xs font-medium cursor-pointer">
            {field.label}
          </Label>
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
      )

    case "select":
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select value={stringValue} onValueChange={handleChange}>
            <SelectTrigger className={`h-9 text-sm ${error ? "border-red-500" : ""}`}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
      )

    case "multiselect":
      const arrayValue = Array.isArray(value) ? value : []
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const newValue = arrayValue.includes(option.value)
                    ? arrayValue.filter((v) => v !== option.value)
                    : [...arrayValue, option.value]
                  handleChange(newValue)
                }}
                className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                  arrayValue.includes(option.value)
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-border hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
      )

    case "text":
    case "script":
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            className={`text-sm font-mono ${error ? "border-red-500" : ""}`}
            rows={4}
            placeholder={field.type === "script" ? "#!/bin/bash\n# Your script here" : "Enter text..."}
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={field.maxLength}
          />
          {field.maxLength && (
            <p className="text-[11px] text-muted-foreground">
              {stringValue.length} / {field.maxLength}
            </p>
          )}
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
      )

    case "array":
    case "object":
    case "key_value":
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            className={`text-sm font-mono ${error ? "border-red-500" : ""}`}
            rows={3}
            placeholder={
              field.type === "key_value"
                ? 'KEY=value\nKEY2=value2'
                : field.type === "array"
                  ? '["item1", "item2"]'
                  : '{"key": "value"}'
            }
            value={typeof value === "string" ? value : JSON.stringify(value ?? field.default ?? (field.type === "array" ? [] : {}))}
            onChange={(e) => {
              try {
                if (field.type === "key_value") {
                  const pairs = e.target.value.split("\n").filter((line) => line.trim())
                  const obj: Record<string, string> = {}
                  pairs.forEach((pair) => {
                    const [key, ...rest] = pair.split("=")
                    obj[key] = rest.join("=")
                  })
                  handleChange(obj)
                } else {
                  handleChange(JSON.parse(e.target.value))
                }
              } catch {
                handleChange(e.target.value)
              }
            }}
          />
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
      )

    default:
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">{field.label}</Label>
          <Input
            type="text"
            className="h-9 text-sm"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
      )
  }
}
