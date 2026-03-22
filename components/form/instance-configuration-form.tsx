"use client"

import { Separator } from "@/components/ui/separator"
import { FormFieldComponent } from "./form-field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TemplateDefinition } from "@/lib/api/types"

interface InstanceConfigurationFormProps {
  definition: TemplateDefinition
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  errors?: Record<string, string>
}

export function InstanceConfigurationForm({
  definition,
  values,
  onChange,
  errors = {},
}: InstanceConfigurationFormProps) {
  const instanceConfigs = (definition as any).instance_configurations

  if (!instanceConfigs || Object.keys(instanceConfigs).length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No instance configuration options available for this template.
      </div>
    )
  }

  const handleFieldChange = (instanceKey: string, fieldName: string, value: unknown) => {
    const instanceValues = (values[instanceKey] as Record<string, unknown>) || {}
    onChange({
      ...values,
      [instanceKey]: {
        ...instanceValues,
        [fieldName]: value,
      },
    })
  }

  // Sort by position if available
  const sortedInstances = Object.entries(instanceConfigs)
    .sort(([, a], [, b]) => ((a as any).position || 0) - ((b as any).position || 0))

  return (
    <div className="flex flex-col gap-6">
      {sortedInstances.map(([instanceKey, config]: [string, any]) => (
        <Card key={instanceKey} className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{config.label}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {config.type === "deployment" ? "GKE Deployment" : "Instance"}
                  </Badge>
                </div>
                {config.description && (
                  <CardDescription className="text-sm">{config.description}</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4">
              {config.sections && config.sections.length > 0 ? (
                config.sections.map((section: any, sectionIdx: number) => (
                  <div key={section.name}>
                    {sectionIdx > 0 && <Separator className="my-3" />}
                    <div className="flex flex-col gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{section.label}</h4>
                        {section.description && (
                          <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {section.fields.map((field: any) => (
                          <div
                            key={field.name}
                            className={
                              field.type === "text" || field.type === "script" ? "md:col-span-2" : ""
                            }
                          >
                            <FormFieldComponent
                              field={field}
                              value={
                                ((values[instanceKey] as Record<string, unknown>) || {})[field.name]
                              }
                              onChange={(value) =>
                                handleFieldChange(instanceKey, field.name, value)
                              }
                              error={errors[`${instanceKey}.${field.name}`]}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No configuration options available for this instance type.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
