"use client"

import { Separator } from "@/components/ui/separator"
import { FormFieldComponent } from "./form-field"
import type { TemplateDefinition } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { Server, Settings } from "lucide-react"

const GROUP_STYLE: Record<string, string> = {
  deploy: "border-sky-500/30 bg-sky-500/5",
  nginx:  "border-emerald-500/30 bg-emerald-500/5",
}

const GROUP_HEADER_STYLE: Record<string, string> = {
  deploy: "text-sky-700",
  nginx:  "text-emerald-700",
}

const GROUP_ICON: Record<string, React.ReactNode> = {
  server:   <Server className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
}

interface EnvironmentConfigurationFormProps {
  definition: TemplateDefinition
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  errors?: Record<string, string>
}

export function EnvironmentConfigurationForm({
  definition,
  values,
  onChange,
  errors = {},
}: EnvironmentConfigurationFormProps) {
  const environmentConfig = (definition as any).environment_configuration

  if (!environmentConfig || !environmentConfig.sections || environmentConfig.sections.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No environment configuration fields available for this template.
      </div>
    )
  }

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({ ...values, [fieldName]: value })
  }

  const groups: any[] = environmentConfig.groups ?? []
  const sections: any[] = environmentConfig.sections

  const renderSection = (section: any, sectionIdx: number, total: number) => (
    <div key={section.name}>
      {sectionIdx > 0 && <Separator className="my-2" />}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
          {section.description && (
            <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {section.fields.map((field: any) => (
            <div
              key={field.name}
              className={field.type === "text" || field.type === "script" ? "md:col-span-2" : ""}
            >
              <FormFieldComponent
                field={field}
                value={values[field.name]}
                onChange={(value) => handleFieldChange(field.name, value)}
                error={errors[field.name]}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{environmentConfig.label}</h2>
        {environmentConfig.description && (
          <p className="text-sm text-muted-foreground mt-1">{environmentConfig.description}</p>
        )}
      </div>

      {groups.length > 0 ? (
        // Grouped layout
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const groupSections = sections.filter((s) => s.group === group.name)
            return (
              <div
                key={group.name}
                className={cn("rounded-lg border p-4 flex flex-col gap-4", GROUP_STYLE[group.name] ?? "border-border bg-muted/30")}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(GROUP_HEADER_STYLE[group.name] ?? "text-foreground")}>
                    {GROUP_ICON[group.icon ?? ""] ?? null}
                  </span>
                  <div>
                    <h3 className={cn("text-sm font-semibold", GROUP_HEADER_STYLE[group.name] ?? "text-foreground")}>
                      {group.label}
                    </h3>
                    {group.description && (
                      <p className="text-xs text-muted-foreground">{group.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {groupSections.map((section, idx) => renderSection(section, idx, groupSections.length))}
                </div>
              </div>
            )
          })}

          {/* Ungrouped sections fallback */}
          {sections.filter((s) => !s.group).length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-4">
              {sections.filter((s) => !s.group).map((section, idx, arr) => renderSection(section, idx, arr.length))}
            </div>
          )}
        </div>
      ) : (
        // Flat layout (no groups)
        <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-4">
          {sections.map((section, idx) => renderSection(section, idx, sections.length))}
        </div>
      )}
    </div>
  )
}

