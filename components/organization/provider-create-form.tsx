"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { providersApi } from "@/lib/api/providers"
import type { Provider } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { PROVIDER_TYPES, SLUG_SUGGESTIONS, type SchemaRow } from "./provider-create-form/types"
import { CredentialFieldsBuilder } from "./provider-create-form/credential-fields-builder"

type Props = { onCreated: (provider: Provider) => void }

export function ProviderCreateForm({ onCreated }: Props) {
  const { currentOrg } = useAuth()
  const [name, setName]               = useState("")
  const [slug, setSlug]               = useState("")
  const [description, setDescription] = useState("")
  const [type, setType]               = useState<Provider["type"]>("GCP")
  const [schemaRows, setSchemaRows]   = useState<SchemaRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleTypeChange(value: string) {
    const t = value as Provider["type"]
    setType(t)
    if (!slug) setSlug(SLUG_SUGGESTIONS[t] ?? "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !currentOrg) return
    for (const row of schemaRows) {
      if (!row.name.trim() || !row.label.trim()) {
        toast.error("All credential fields must have a name and label."); return
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
        name: name.trim(), slug: slug.trim() || undefined, description: description.trim() || undefined,
        type, status: "ACTIVE", variable_schemas,
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
      <div className="space-y-1.5">
        <Label htmlFor="provider-name">Name *</Label>
        <Input id="provider-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GCP Production" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provider-type">Type *</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger id="provider-type"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {PROVIDER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provider-slug">Slug</Label>
        <Input id="provider-slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))} placeholder="e.g. gcp, aws, slurm" />
        <p className="text-xs text-muted-foreground">Unique identifier within this organization.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provider-description">Description</Label>
        <Textarea id="provider-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description…" rows={2} />
      </div>

      <CredentialFieldsBuilder rows={schemaRows} onChange={setSchemaRows} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? "Creating…" : "Create Provider"}
        </Button>
      </div>
    </form>
  )
}
