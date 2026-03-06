"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Hash, ToggleLeft, Type, AlignLeft, List, AlertCircle } from "lucide-react"
import type { TemplateDefinition, FormSection, FormField } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const FIELD_TYPE_ICON: Record<string, React.ReactNode> = {
  string:      <Type className="h-3 w-3" />,
  text:        <AlignLeft className="h-3 w-3" />,
  textarea:    <AlignLeft className="h-3 w-3" />,
  number:      <Hash className="h-3 w-3" />,
  boolean:     <ToggleLeft className="h-3 w-3" />,
  select:      <List className="h-3 w-3" />,
  multiselect: <List className="h-3 w-3" />,
}

const FIELD_TYPE_COLOR: Record<string, string> = {
  string:      "text-blue-500",
  text:        "text-blue-500",
  textarea:    "text-blue-500",
  number:      "text-amber-500",
  boolean:     "text-green-500",
  select:      "text-purple-500",
  multiselect: "text-purple-500",
  array:       "text-pink-500",
  object:      "text-rose-500",
}

interface Props {
  definition: TemplateDefinition
}

export function DefinitionViewer({ definition }: Props) {
  if (!definition) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        No definition configured.
      </div>
    )
  }

  const expConfig = definition.experiment_configuration
  const instConfigs = definition.instance_configurations ?? {}

  return (
    <div className="flex flex-col gap-3">
      {/* Experiment Configuration */}
      {expConfig && (
        <ConfigSection
          title={expConfig.label ?? "Experiment Configuration"}
          description={expConfig.description}
          badge="experiment"
          badgeColor="bg-blue-500/10 text-blue-600 border-blue-500/20"
          sections={expConfig.sections ?? []}
        />
      )}

      {/* Instance Configurations */}
      {Object.entries(instConfigs).map(([key, cfg], idx) => (
        <ConfigSection
          key={key}
          title={cfg.label ?? key}
          description={cfg.description}
          badge={cfg.type ?? "instance"}
          badgeColor="bg-purple-500/10 text-purple-600 border-purple-500/20"
          sections={cfg.sections ?? []}
          slug={key}
          position={cfg.position ?? idx + 1}
        />
      ))}

      {/* Empty state */}
      {!expConfig && Object.keys(instConfigs).length === 0 && (
        <p className="text-xs text-muted-foreground italic">Empty definition.</p>
      )}
    </div>
  )
}

interface ConfigSectionProps {
  title: string
  description?: string
  badge?: string
  badgeColor?: string
  sections: FormSection[]
  slug?: string
  position?: number
}

function ConfigSection({ title, description, badge, badgeColor, sections, slug, position }: ConfigSectionProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 bg-muted/40 text-left hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="text-sm font-medium truncate">{title}</span>
          {slug && <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded">{slug}</code>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-medium", badgeColor)}>
              {badge}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {sections.reduce((sum, s) => sum + (s.fields?.length ?? 0), 0)} fields
          </span>
        </div>
      </button>

      {open && (
        <div className="divide-y divide-border">
          {sections.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground italic">No sections defined.</p>
          )}
          {sections.map((section) => (
            <SectionBlock key={section.name} section={section} />
          ))}
        </div>
      )}
    </div>
  )
}

function SectionBlock({ section }: { section: FormSection }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-semibold">{section.label}</span>
          <code className="text-[10px] text-muted-foreground font-mono">{section.name}</code>
        </div>
        <span className="text-[11px] text-muted-foreground">{section.fields?.length ?? 0} fields</span>
      </button>

      {open && section.description && (
        <p className="px-8 pb-1 text-[11px] text-muted-foreground italic">{section.description}</p>
      )}

      {open && (
        <div className="px-4 pb-3 pt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {(section.fields ?? []).map((field) => (
            <FieldCard key={field.name} field={field} />
          ))}
        </div>
      )}
    </div>
  )
}

function FieldCard({ field }: { field: FormField }) {
  const icon = FIELD_TYPE_ICON[field.type] ?? <Type className="h-3 w-3" />
  const color = FIELD_TYPE_COLOR[field.type] ?? "text-muted-foreground"

  return (
    <div className="rounded border border-border bg-background p-2.5 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("shrink-0", color)}>{icon}</span>
          <span className="text-xs font-medium truncate">{field.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {field.required && (
            <span className="rounded bg-red-500/10 text-red-500 border border-red-500/20 px-1 py-0.5 text-[10px]">required</span>
          )}
          <span className="rounded bg-muted text-muted-foreground px-1 py-0.5 text-[10px] font-mono">{field.type}</span>
        </div>
      </div>

      <code className="text-[10px] text-muted-foreground font-mono">{field.name}</code>

      {field.description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{field.description}</p>
      )}

      {field.default !== undefined && field.default !== "" && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="font-medium">Default:</span>
          <code className="font-mono">{String(field.default)}</code>
        </div>
      )}

      {field.options && field.options.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {field.options.map((opt) => (
            <span key={opt.value} className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">
              {opt.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
