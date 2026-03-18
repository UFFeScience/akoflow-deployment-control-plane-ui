"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { providerSchemasApi } from "@/lib/api/provider-schemas"
import { providersApi } from "@/lib/api/providers"
import type { ProviderVariableSchema, ProviderCredential } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

type Props = {
  providerId: string
  providerSlug?: string
  onCreated: (credential: ProviderCredential) => void
  onCancel: () => void
}


// Group schemas by section
function groupBySection(schemas: ProviderVariableSchema[]) {
  return schemas.reduce<Record<string, ProviderVariableSchema[]>>((acc, s) => {
    ;(acc[s.section] ??= []).push(s)
    return acc
  }, {})
}


function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function SchemaField({
  schema,
  value,
  onChange,
}: {
  schema: ProviderVariableSchema
  value: string
  onChange: (v: string) => void
}) {
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

export function ProviderCredentialForm({ providerId, providerSlug, onCreated, onCancel }: Props) {
  const [schemas, setSchemas] = useState<ProviderVariableSchema[]>([])
  const [isSchemasLoading, setIsSchemasLoading] = useState(false)
  const [credentialName, setCredentialName] = useState("")
  const { currentOrg } = useAuth()
  const [credentialDescription, setCredentialDescription] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!providerSlug) return
    setIsSchemasLoading(true)
    providerSchemasApi
      .listBySlug(providerSlug)
      .then((list) => {
        setSchemas(list)
        // Pre-fill defaults
        const defaults: Record<string, string> = {}
        list.forEach((s) => {
          if (s.default_value) defaults[s.name] = s.default_value
        })
        setValues(defaults)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load schema"))
      .finally(() => setIsSchemasLoading(false))
  }, [providerSlug])

  const grouped = useMemo(() => groupBySection(schemas), [schemas])
  const sections = useMemo(() => Object.keys(grouped).sort(), [grouped])

  function handleChange(field: string, val: string) {
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!credentialName.trim()) return

    // Validate required fields
    const missing = schemas.filter((s) => s.required && !values[s.name]?.trim())
    if (missing.length > 0) {
      toast.error(`Required fields missing: ${missing.map((s) => s.label).join(", ")}`)
      return
    }

    if (!currentOrg) return
    setIsSubmitting(true)
    try {
      const cred = await providersApi.createCredential(String(currentOrg.id), providerId, {
        name: credentialName.trim(),
        description: credentialDescription.trim() || undefined,
        is_active: true,
        values,
      })
      onCreated(cred as ProviderCredential)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create credential")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Credential metadata */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cred-name">Credential Name *</Label>
          <Input
            id="cred-name"
            value={credentialName}
            onChange={(e) => setCredentialName(e.target.value)}
            placeholder="e.g. Production Key"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cred-desc">Description</Label>
          <Input
            id="cred-desc"
            value={credentialDescription}
            onChange={(e) => setCredentialDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Dynamic schema fields */}
      {isSchemasLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : schemas.length === 0 ? (
        !providerSlug ? (
          <p className="text-sm text-muted-foreground">
            No schema found. You can still name the credential above.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No variable schema defined for slug &quot;{providerSlug}&quot;.
          </p>
        )
      ) : (
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
                    {schema.required && (
                      <span className="text-destructive text-xs">*</span>
                    )}
                    {schema.is_sensitive && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-300">
                        sensitive
                      </Badge>
                    )}
                  </div>
                  <SchemaField
                    schema={schema}
                    value={values[schema.name] ?? ""}
                    onChange={(v) => handleChange(schema.name, v)}
                  />
                  {schema.description && (
                    <p className="text-xs text-muted-foreground">{schema.description}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !credentialName.trim()}>
          {isSubmitting ? "Saving…" : "Save Credential"}
        </Button>
      </div>
    </form>
  )
}
