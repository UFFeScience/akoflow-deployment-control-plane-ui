"use client"

import { Separator } from "@/components/ui/separator"
import { FormFieldComponent } from "./form-field"
import type { TemplateDefinition } from "@/lib/api/types"

interface DynamicFormProps {
  definition: TemplateDefinition
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  errors?: Record<string, string>
}

export function DynamicForm({ definition, values, onChange, errors = {} }: DynamicFormProps) {
  if (!definition.sections || definition.sections.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No configuration fields available for this template.
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
    <div className="flex flex-col gap-4">
      {definition.sections.map((section, sectionIdx) => (
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
              {section.fields.map((field) => (
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
  )
}
