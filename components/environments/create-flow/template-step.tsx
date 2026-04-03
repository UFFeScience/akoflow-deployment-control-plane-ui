"use client"

import { Check } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { Template, TemplateVersion } from "@/lib/api/types"

interface TemplateStepProps {
  templates: Template[]
  selectedTemplateId: string
  onSelectTemplate: (id: string) => void
  templateVersions: TemplateVersion[]
  selectedVersionId: string | null
  onSelectVersion: (id: string) => void
  isLoadingVersions: boolean
}

export function TemplateStep({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  templateVersions,
  selectedVersionId,
  onSelectVersion,
  isLoadingVersions,
}: TemplateStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Environment template</h2>
        <p className="text-xs text-muted-foreground">Pick a template to prefill defaults and metadata.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TemplateCard
          id="none"
          name="No template"
          description="Start from scratch and configure deployments manually."
          isSelected={selectedTemplateId === "none"}
          onSelect={() => onSelectTemplate("none")}
        />
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            name={template.name}
            description={template.description}
            latestVersion={template.latestVersion}
            isSelected={selectedTemplateId === template.id}
            onSelect={() => onSelectTemplate(template.id)}
          />
        ))}
      </div>

      {selectedTemplateId !== "none" && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs">
            Version
            {isLoadingVersions && <span className="ml-2 text-[10px] text-muted-foreground">Loading…</span>}
          </Label>
          {!isLoadingVersions && templateVersions.length > 0 && (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {templateVersions.map((ver) => (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => onSelectVersion(String(ver.id))}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    selectedVersionId === String(ver.id)
                      ? "border-primary/60 bg-primary/5"
                      : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <span className="font-mono font-medium">v{ver.version}</span>
                  <span className="flex items-center gap-1.5">
                    {ver.is_active && (
                      <span className="text-[10px] rounded bg-green-500/10 text-green-600 px-1">active</span>
                    )}
                    {selectedVersionId === String(ver.id) && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!isLoadingVersions && templateVersions.length === 0 && (
            <p className="text-xs text-muted-foreground">No versions found for this template.</p>
          )}
        </div>
      )}
    </div>
  )
}

interface TemplateCardProps {
  id: string
  name: string
  description?: string | null
  latestVersion?: string | null
  isSelected: boolean
  onSelect: () => void
}

function TemplateCard({ id, name, description, latestVersion, isSelected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
        isSelected ? "border-primary/60 bg-primary/5" : "border-border bg-background"
      }`}
    >
      <div className="flex items-center justify-between text-sm font-semibold text-foreground">
        {name}
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-3">{description}</p>
      )}
      {latestVersion && (
        <span className="text-[11px] text-muted-foreground">v{latestVersion}</span>
      )}
    </button>
  )
}
