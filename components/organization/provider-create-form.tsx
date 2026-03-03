"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { providersApi } from "@/lib/api/providers"
import type { Provider } from "@/lib/api/types"
import { toast } from "sonner"

type Props = {
  onCreated: (provider: Provider) => void
}

const PROVIDER_TYPES = [
  { value: "CLOUD", label: "Cloud (GCP, AWS, Azure…)" },
  { value: "ON_PREM", label: "On-Premises" },
  { value: "HPC", label: "HPC / Slurm" },
]

const SLUG_SUGGESTIONS: Record<string, string> = {
  CLOUD: "gcp",
  ON_PREM: "",
  HPC: "slurm",
}

export function ProviderCreateForm({ onCreated }: Props) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<string>("CLOUD")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleTypeChange(value: string) {
    setType(value)
    if (!slug) setSlug(SLUG_SUGGESTIONS[value] ?? "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const provider = await providersApi.create({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        type: type as Provider["type"],
        status: "ACTIVE",
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
          Used to match the provider with its variable schema template.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provider-description">Description</Label>
        <Textarea
          id="provider-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description…"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? "Creating…" : "Create Provider"}
        </Button>
      </div>
    </form>
  )
}
