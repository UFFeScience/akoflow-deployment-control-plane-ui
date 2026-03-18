"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileCode2, Globe, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { templatesApi } from "@/lib/api/templates"
import type { Template } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"
import { TemplateCard, SkeletonGrid, EmptySection } from "@/components/templates/template-card"

export function TemplatesList() {
  const router = useRouter()
  const { currentOrg } = useAuth()
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

  const publicTemplates = templates.filter((t) => t.is_public)
  const orgTemplates = templates.filter((t) => !t.is_public)

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Environment Templates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reusable templates that define the infrastructure and configuration for environments.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => router.push("/organization/templates/new")}>
          <Plus className="h-3.5 w-3.5" />
          New Template
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Public Templates */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-green-600" />
          <h2 className="text-sm font-semibold">Public Templates</h2>
          {!isLoading && (
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {publicTemplates.length}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Templates shared across all organizations.
        </p>

        {isLoading ? (
          <SkeletonGrid />
        ) : publicTemplates.length === 0 ? (
          <EmptySection label="No public templates available." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicTemplates.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} />
            ))}
          </div>
        )}
      </section>

      {/* Organization Templates */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Organization Templates</h2>
          {!isLoading && (
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {orgTemplates.length}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Private templates created by {currentOrg?.name ?? "your organization"}.
        </p>

        {isLoading ? (
          <SkeletonGrid />
        ) : orgTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-10 text-center">
            <FileCode2 className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No organization templates yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create a template to standardize environment configurations.
            </p>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => router.push("/organization/templates/new")}>
              <Plus className="h-3.5 w-3.5" />
              New Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orgTemplates.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
