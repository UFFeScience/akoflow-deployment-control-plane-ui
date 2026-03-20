"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { providersApi } from "@/lib/api/providers"
import type { Provider, ProviderVariableSchema } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

type Props = {
  onCreated: (provider: Provider) => void
}

const PROVIDER_TYPES: { value: Provider["type"]; label: string }[] = [
  { value: "AWS",     label: "AWS" },
  { value: "GCP",     label: "GCP" },
  { value: "AZURE",   label: "Azure" },
  { value: "ON_PREM", label: "On-Premises" },
  { value: "HPC",     label: "HPC / Slurm" },
  { value: "CUSTOM",  label: "Custom" },
]

const SLUG_SUGGESTIONS: Partial<Record<Provider["type"], string>> = {
  AWS:     "aws",
  GCP:     "gcp",
  AZURE:   "azure",
  HPC:     "slurm",
  ON_PREM: "",
  CUSTOM:  "",
}

const FIELD_TYPES: ProviderVariableSchema["type"][] = [
  "string", "secret", "textarea", "select", "boolean", "number",
]

type SchemaRow = {
  key: string // local uuid for React key
  section: string
  name: string
  label: string
  description: string
  type: ProviderVariableSchema["type"]
  required: boolean
  is_sensitive: boolean
  default_value: string
  options_raw: string // comma-separated for select
}

function emptyRow(): SchemaRow {
  return {
    key: Math.random().toString(36).slice(2),
    section: "general",
    name: "",
    label: "",
    description: "",
    type: "string",
    required: false,
    is_sensitive: false,
    default_value: "",
    options_raw: "",
  }
}

export function ProviderCreateForm({ onCreated }: Props) {
  const { currentOrg } = useAuth()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<Provider["type"]>("GCP")
  const [schemaRows, setSchemaRows] = useState<SchemaRow[]>([])
  const [schemasOpen, setSchemasOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleTypeChange(value: string) {
    const t = value as Provider["type"]
    setType(t)
    if (!slug) setSlug(SLUG_SUGGESTIONS[t] ?? "")
  }

  function updateRow(key: string, patch: Partial<SchemaRow>) {
    setSchemaRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setSchemaRows((prev) => prev.filter((r) => r.key !== key))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !currentOrg) return

    // Validate schema rows
    for (const row of schemaRows) {
      if (!row.name.trim() || !row.label.trim()) {
        toast.error("All credential fields must have a name and label.")
        return
      }
    }

    setIsSubmitting(true)
    try {
      const variable_schemas = schemaRows.map((r, i) => ({
        section:       r.section.trim() || "general",
        name:          r.name.trim(),
        label:         r.label.trim(),
        description:   r.description.trim() || undefined,
        type:          r.type,
        required:      r.required,
        is_sensitive:  r.is_sensitive,
        position:      i,
        options:       r.type === "select" && r.options_raw.trim()
                         ? r.options_raw.split(",").map((o) => o.trim()).filter(Boolean)
                         : undefined,
        default_value: r.default_value.trim() || undefined,
      }))

      const provider = await providersApi.create(String(currentOrg.id), {
        name:             name.trim(),
        slug:             slug.trim() || undefined,
        description:      description.trim() || undefined,
        type,
        status:           "ACTIVE",
        variable_schemas: variable_schemas,
      })
      onCreated(provider as Provider)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create provider")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic info */}
      <div className="space-y-1.5">
        <Label htmlFor="provider-name">Name *</Label>
        <Input
          id="provider-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. GCP Production"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provider-type">Type *</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger id="provider-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provider-slug">Slug</Label>
        <Input
          id="provider-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
          placeholder="e.g. gcp, aws, slurm"
        />
        <p className="text-xs text-muted-foreground">
          Unique identifier within this organization.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provider-description">Description</Label>
        <Textarea
          id="provider-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description…"
          rows={2}
        />
      </div>

      {/* Credential fields builder */}
      <div className="rounded-md border border-border">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
          onClick={() => setSchemasOpen((o) => !o)}
        >
          <span className="flex items-center gap-2">
            Credential Fields
            {schemaRows.length > 0 && (
              <Badge variant="secondary" className="text-xs">{schemaRows.length}</Badge>
            )}
          </span>
          {schemasOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {schemasOpen && (
          <div className="border-t border-border p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Define the fields that will appear when creating credentials for this provider.
            </p>

            {schemaRows.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-3">
                No fields yet. Add one below.
              </p>
            )}

            {schemaRows.map((row) => (
              <div key={row.key} className="rounded-md border border-border p-3 space-y-2 bg-muted/20">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Name (key) *</Label>
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(row.key, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                      placeholder="e.g. api_key"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Label *</Label>
                    <Input
                      value={row.label}
                      onChange={(e) => updateRow(row.key, { label: e.target.value })}
                      placeholder="e.g. API Key"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Type *</Label>
                    <Select value={row.type} onValueChange={(v) => updateRow(row.key, { type: v as ProviderVariableSchema["type"] })}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Section</Label>
                    <Input
                      value={row.section}
                      onChange={(e) => updateRow(row.key, { section: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                      placeholder="general"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                {row.type === "select" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Options (comma-separated)</Label>
                    <Input
                      value={row.options_raw}
                      onChange={(e) => updateRow(row.key, { options_raw: e.target.value })}
                      placeholder="option1, option2, option3"
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Default value</Label>
                  <Input
                    value={row.default_value}
                    onChange={(e) => updateRow(row.key, { default_value: e.target.value })}
                    className="h-7 text-xs"
                    placeholder="Optional"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Switch
                        checked={row.required}
                        onCheckedChange={(v) => updateRow(row.key, { required: v })}
                        className="scale-75"
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Switch
                        checked={row.is_sensitive}
                        onCheckedChange={(v) => updateRow(row.key, { is_sensitive: v })}
                        className="scale-75"
                      />
                      Sensitive
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => removeRow(row.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSchemaRows((prev) => [...prev, emptyRow()])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Field
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? "Creating…" : "Create Provider"}
        </Button>
      </div>
    </form>
  )
}
