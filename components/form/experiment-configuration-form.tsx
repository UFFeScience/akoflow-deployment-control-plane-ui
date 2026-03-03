"use client"

import { Separator } from "@/components/ui/separator"
import { FormFieldComponent } from "./form-field"
import type { TemplateDefinition } from "@/lib/api/types"

interface ExperimentConfigurationFormProps {
  definition: TemplateDefinition
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  errors?: Record<string, string>
}

export function ExperimentConfigurationForm({
  definition,
  values,
  onChange,
  errors = {},
}: ExperimentConfigurationFormProps) {
  const experimentConfig = (definition as any).experiment_configuration

  if (!experimentConfig || !experimentConfig.sections || experimentConfig.sections.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No experiment configuration fields available for this template.
      </div>
    )
  }

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({
      ...values,
      [fieldName]: value,
    })
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{experimentConfig.label}</h2>
        {experimentConfig.description && (
          <p className="text-sm text-muted-foreground mt-2">{experimentConfig.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {experimentConfig.sections.map((section: any, sectionIdx: number) => (
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
        ))}
      </div>
    </div>
  )
}
