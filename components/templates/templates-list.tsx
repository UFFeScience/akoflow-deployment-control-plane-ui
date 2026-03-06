"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, FileCode2, Globe, Lock, ChevronRight, Layers, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { templatesApi } from "@/lib/api/templates"
import type { Template } from "@/lib/api/types"

const RUNTIME_COLORS: Record<string, string> = {
  AKOFLOW: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  NVFLARE: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  FLARE:   "bg-purple-500/10 text-purple-600 border-purple-500/20",
  HPC:     "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CUSTOM:  "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
}

export function TemplatesList() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    templatesApi
      .list()
      .then((data) => { if (active) setTemplates(data) })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Experiment Templates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reusable templates that define the infrastructure and configuration for experiments.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => router.push("/organization/templates/new")}>
          <Plus className="h-3.5 w-3.5" />
          New Template
        </Button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isLoading && !error && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <FileCode2 className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">No templates yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create a template to standardize experiment configurations.
          </p>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => router.push("/organization/templates/new")}>
            <Plus className="h-3.5 w-3.5" />
            New Template
          </Button>
        </div>
      )}

      {!isLoading && !error && templates.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} />
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template }: { template: Template }) {
  const runtimeColor = RUNTIME_COLORS[template.runtime_type ?? "CUSTOM"] ?? RUNTIME_COLORS.CUSTOM
  const versionsCount = template.versions_count ?? template.versions?.length ?? 0
  const activeVersion = template.active_version ?? template.versions?.find((v) => v.is_active)

  return (
    <Link href={`/organization/templates/${template.id}`}>
      <div className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 cursor-pointer h-full">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold truncate">{template.name}</span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{template.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 flex-wrap mt-auto">
          {template.runtime_type && (
            <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${runtimeColor}`}>
              <Cpu className="h-3 w-3" />
              {template.runtime_type}
            </span>
          )}
          {template.is_public ? (
            <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium bg-green-500/10 text-green-600 border-green-500/20">
              <Globe className="h-3 w-3" />
              Public
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium bg-zinc-500/10 text-zinc-600 border-zinc-500/20">
              <Lock className="h-3 w-3" />
              Private
            </span>
          )}
          <span className="inline-flex items-center gap-1 ml-auto text-[11px] text-muted-foreground">
            <Layers className="h-3 w-3" />
            {versionsCount} {versionsCount === 1 ? "version" : "versions"}
          </span>
          {activeVersion && (
            <span className="text-[11px] text-muted-foreground font-mono">
              v{activeVersion.version}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
