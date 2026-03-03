"use client"

import { Separator } from "@/components/ui/separator"
import { FormFieldComponent } from "./form-field"
import type { TemplateDefinition } from "@/lib/api/types"

interface LifecycleHooksFormProps {
  definition: TemplateDefinition
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  errors?: Record<string, string>
}

export function LifecycleHooksForm({ definition, values, onChange, errors = {} }: LifecycleHooksFormProps) {
  if (!definition.lifecycle_hooks || definition.lifecycle_hooks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No lifecycle hooks configured for this template.
      </div>
    )
  }

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({
      ...values,
      [fieldName]: String(value),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Lifecycle Hooks</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Scripts to run before and after cluster provisioning
        </p>
      </div>
      <Separator />
      <div className="flex flex-col gap-4">
        {definition.lifecycle_hooks.map((hook, idx) => (
          <div key={hook.name}>
            {idx > 0 && <Separator className="my-2" />}
            <FormFieldComponent
              field={{
                name: hook.name,
                label: hook.label,
                type: hook.type,
                required: hook.required,
                description: hook.description,
                maxLength: hook.maxLength,
              }}
              value={values[hook.name] || ""}
              onChange={(value) => handleFieldChange(hook.name, value)}
              error={errors[hook.name]}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
