"use client"

import { AlertCircle } from "lucide-react"
import type { TemplateDefinition } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { GROUP_ICON, GROUP_COLOR, GROUP_BADGE_COLOR } from "./definition-viewer/constants"
import { SectionRows } from "./definition-viewer/section-block"
import { ConfigSection } from "./definition-viewer/config-section"

interface Props {
  definition: TemplateDefinition
}

export function DefinitionViewer({ definition }: Props) {
  if (!definition) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />No definition configured.
      </div>
    )
  }

  const expConfig = definition.environment_configuration
  const groups    = expConfig?.groups ?? []
  const sections  = expConfig?.sections ?? []

  if (groups.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const groupSections = sections.filter((s) => s.group === group.name)
          return (
            <div key={group.name} className={cn("rounded-lg border overflow-hidden", GROUP_COLOR[group.name] ?? "border-border bg-background")}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-inherit">
                <span className="text-muted-foreground">{GROUP_ICON[group.icon ?? ""] ?? null}</span>
                <span className="text-sm font-semibold">{group.label}</span>
                {group.description && <span className="text-xs text-muted-foreground hidden sm:block">— {group.description}</span>}
                <span className={cn("ml-auto rounded border px-1.5 py-0.5 text-[11px] font-medium", GROUP_BADGE_COLOR[group.name] ?? "bg-muted/40 text-muted-foreground border-border")}>
                  {groupSections.reduce((sum, s) => sum + (s.fields?.length ?? 0), 0)} fields
                </span>
              </div>
              <div className="flex flex-col gap-0 divide-y divide-border/60 px-4 py-3">
                {groupSections.map((section) => <SectionRows key={section.name} section={section} />)}
                {groupSections.length === 0 && <p className="text-xs text-muted-foreground italic py-1">No sections in this group.</p>}
              </div>
            </div>
          )
        })}
        {sections.filter((s) => !s.group).map((section) => (
          <ConfigSection key={section.name} title={section.label} description={section.description}
            badge="section" badgeColor="bg-muted/40 text-muted-foreground border-border" sections={[section]} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {expConfig && (
        <ConfigSection title={expConfig.label ?? "Environment Configuration"} description={expConfig.description}
          badge="environment" badgeColor="bg-blue-500/10 text-blue-600 border-blue-500/20" sections={sections} />
      )}
      {!expConfig && <p className="text-xs text-muted-foreground italic">Empty definition.</p>}
    </div>
  )
}
