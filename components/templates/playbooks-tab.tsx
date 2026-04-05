"use client"

import { useEffect, useState } from "react"
import { Loader2, Terminal, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import type { ProviderConfiguration, TemplateVersion } from "@/lib/api/types"
import { ConfigPlaybookSection } from "./playbooks-tab/config-playbook-section"
import { TeardownPlaybookSection } from "./playbooks-tab/teardown-playbook-section"
import { RunbooksSection } from "./playbooks-tab/runbooks-section"

interface PlaybooksTabProps {
  templateId: string
  versionId: string
  version: TemplateVersion
}

export function PlaybooksTab({ templateId, versionId, version }: PlaybooksTabProps) {
  const [configs, setConfigs] = useState<ProviderConfiguration[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    templatesApi.listProviderConfigurations(templateId, versionId)
      .then((list) => {
        setConfigs(list)
        setActiveId(list[0]?.id ?? null)
      })
      .finally(() => setLoading(false))
  }, [templateId, versionId])

  const activeConfig = configs.find((c) => c.id === activeId) ?? null

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
      <Loader2 className="h-4 w-4 animate-spin" />Loading...
    </div>
  )

  if (configs.length === 0) return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      <Settings2 className="h-4 w-4" />
      No provider configurations found. Create one in the Configuration tab first.
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        {configs.map((cfg) => (
          <button
            key={cfg.id}
            type="button"
            onClick={() => setActiveId(cfg.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors",
              activeId === cfg.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            <Terminal className="h-3 w-3 shrink-0" />
            {cfg.name}
            {cfg.applies_to_providers.length > 0 && (
              <span className="text-[10px] opacity-70 font-normal">({cfg.applies_to_providers.join(", ")})</span>
            )}
          </button>
        ))}
      </div>

      {activeConfig && (
        <div className="flex flex-col gap-5">
          <ConfigPlaybookSection
            key={`playbook-${activeConfig.id}`}
            templateId={templateId}
            versionId={versionId}
            config={activeConfig}
          />

          <div className="h-px bg-border" />

          <TeardownPlaybookSection
            key={`teardown-${activeConfig.id}`}
            templateId={templateId}
            versionId={versionId}
            config={activeConfig}
          />

          <div className="h-px bg-border" />

          <RunbooksSection
            key={`runbooks-${activeConfig.id}`}
            templateId={templateId}
            versionId={versionId}
            config={activeConfig}
          />
        </div>
      )}
    </div>
  )
}
