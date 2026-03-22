"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Environment } from "@/lib/api/types"

interface ConfigurationTabProps {
  environment: Environment
}

function ValueDisplay({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground text-xs italic">—</span>
  }
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
        {value ? "Yes" : "No"}
      </Badge>
    )
  }
  return <span className="text-xs font-mono">{String(value)}</span>
}

function SectionFields({
  fields,
  values,
}: {
  fields: Array<{ name: string; label: string; description?: string; type: string }>
  values: Record<string, unknown>
}) {
  if (!fields.length) return null
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-muted-foreground">{field.label}</span>
          <ValueDisplay value={values[field.name]} />
          {field.description && (
            <span className="text-[10px] text-muted-foreground/70">{field.description}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function ConfigurationTab({ environment }: ConfigurationTabProps) {
  const configJson: Record<string, unknown> =
    (environment as any).configuration_json || {}

  const environmentConfig = configJson.environment_configuration as Record<string, unknown> | undefined
  const lifecycleHooks = configJson.lifecycle_hooks as Record<string, string> | undefined

  const templateName = (environment as any).template_name || environment.templateName
  const hasConfig = environmentConfig && Object.keys(environmentConfig).length > 0

  if (!templateName && !hasConfig) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-xs text-muted-foreground">
        This environment has no template configuration. It was created without a template.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {templateName && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Based on template:</span>
          <Badge variant="outline" className="text-xs font-medium text-primary border-primary/30">
            {templateName}
          </Badge>
        </div>
      )}

      {/* Environment-level configuration */}
      {environmentConfig && Object.keys(environmentConfig).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Environment Configuration</CardTitle>
            <CardDescription className="text-xs">
              High-level settings applied across the entire environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(environmentConfig).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <ValueDisplay value={value} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifecycle hooks */}
      {lifecycleHooks && Object.keys(lifecycleHooks).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Lifecycle Hooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {Object.entries(lifecycleHooks).map(([hook, script]) => (
                <div key={hook} className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground capitalize">
                    {hook.replace(/_/g, " ")}
                  </span>
                  <pre className="rounded bg-muted px-2 py-1.5 text-[10px] font-mono overflow-x-auto">
                    {script}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasConfig && templateName && (
        <div className="text-xs text-muted-foreground">
          This environment uses the <span className="font-medium text-foreground">{templateName}</span> template
          but no configuration values were saved at creation time.
        </div>
      )}
    </div>
  )
}
