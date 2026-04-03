"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DraftProvider } from "./types"
import { uid } from "./types"

const KNOWN_PROVIDERS = [
  { slug: "aws",     label: "AWS" },
  { slug: "gcp",     label: "GCP" },
  { slug: "azure",   label: "Azure" },
  { slug: "on_prem", label: "On-Premises" },
  { slug: "hpc",     label: "HPC" },
]

interface ProvidersEditorProps {
  providers: DraftProvider[]
  onChange: (providers: DraftProvider[]) => void
}

export function ProvidersEditor({ providers, onChange }: ProvidersEditorProps) {
  const available = KNOWN_PROVIDERS.filter((p) => !providers.some((dp) => dp.slug === p.slug))

  const addProvider = (slug: string) => {
    if (providers.some((p) => p.slug === slug)) return
    onChange([...providers, { _id: uid(), slug, required: false }])
  }

  const removeProvider = (id: string) => onChange(providers.filter((p) => p._id !== id))

  const toggleRequired = (id: string) =>
    onChange(providers.map((p) => p._id === id ? { ...p, required: !p.required } : p))

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">Supported Providers</span>
        <span className="text-[11px] text-muted-foreground">
          Define which cloud / compute providers this template supports.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 min-h-9 rounded-md border border-border bg-muted/10 px-3 py-2">
        {providers.length === 0 && (
          <span className="text-[11px] text-muted-foreground italic">
            No providers — add one or leave empty for single-credential deployments.
          </span>
        )}

        {providers.map((p) => {
          const known = KNOWN_PROVIDERS.find((k) => k.slug === p.slug)
          return (
            <div key={p._id} className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs gap-1.5 pr-1">
                {known?.label ?? p.slug.toUpperCase()}
                <button
                  type="button"
                  onClick={() => toggleRequired(p._id)}
                  className={`text-[10px] rounded px-1 transition-colors font-medium ${
                    p.required
                      ? "text-amber-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={p.required ? "Required — click to make optional" : "Optional — click to make required"}
                >
                  {p.required ? "required" : "optional"}
                </button>
                <button
                  type="button"
                  onClick={() => removeProvider(p._id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )
        })}

        {available.length > 0 && (
          <Select value="" onValueChange={addProvider}>
            <SelectTrigger className="h-6 w-auto text-[11px] gap-1 border-dashed px-2 bg-background">
              <span className="text-muted-foreground">+ Add provider</span>
            </SelectTrigger>
            <SelectContent>
              {available.map((p) => (
                <SelectItem key={p.slug} value={p.slug} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

