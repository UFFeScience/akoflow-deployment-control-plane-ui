"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { useInstanceGroupTemplate } from "@/hooks/use-instance-group-templates"
import { DynamicForm } from "@/components/form/dynamic-form"
import { LifecycleHooksForm } from "@/components/form/lifecycle-hooks-form"
import { Label } from "@/components/ui/label"

interface InstanceGroupSchemaFormProps {
  templateId?: string
  terraformVariables?: Record<string, unknown>
  lifecycleHooks?: Record<string, string>
  onDataChange?: (data: {
    terraform_variables: Record<string, unknown>
    lifecycle_hooks: Record<string, string>
  }) => void
  isCompact?: boolean
}

export function InstanceGroupSchemaForm({
  templateId,
  terraformVariables: initialTerraform = {},
  lifecycleHooks: initialLifecycle = {},
  onDataChange,
  isCompact = false,
}: InstanceGroupSchemaFormProps) {
  const { template, isLoading } = useInstanceGroupTemplate(templateId || null)
  const [terraformVariables, setTerraformVariables] = useState<Record<string, unknown>>({})
  const [lifecycleHooks, setLifecycleHooks] = useState<Record<string, string>>({})
  const [isExpanded, setIsExpanded] = useState(!isCompact)

  const buildDefaults = (sections: Array<{ fields?: Array<{ name: string; default?: unknown }> }> = []) => {
    return sections.reduce<Record<string, unknown>>((acc, section) => {
      section.fields?.forEach((field) => {
        if (field.default !== undefined) {
          acc[field.name] = field.default
        }
      })
      return acc
    }, {})
  }

  useEffect(() => {
    // Reset values when template changes; prefer provided initial values over defaults
    const defaults = template ? buildDefaults(template.definition?.sections || []) : {}
    const mergedTerraform = Object.keys(initialTerraform).length ? initialTerraform : defaults
    setTerraformVariables(mergedTerraform)

    const hookDefaults = (template?.definition?.lifecycle_hooks || []).reduce<Record<string, string>>((acc, hook) => {
      if ((hook as any).default) {
        acc[hook.name] = (hook as any).default as string
      }
      return acc
    }, {})
    const mergedHooks = Object.keys(initialLifecycle).length ? initialLifecycle : hookDefaults
    setLifecycleHooks(mergedHooks)
  }, [template?.id, initialTerraform, initialLifecycle])

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        terraform_variables: terraformVariables,
        lifecycle_hooks: lifecycleHooks,
      })
    }
  }, [terraformVariables, lifecycleHooks, onDataChange])

  if (!templateId) {
    return null
  }

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading template configuration...
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-xs text-destructive">
        Configuration template not found
      </div>
    )
  }

  const hasSections = template.definition?.sections && template.definition.sections.length > 0
  const hasHooks = template.definition?.lifecycle_hooks && template.definition.lifecycle_hooks.length > 0

  if (!hasSections && !hasHooks) {
    return (
      <div className="text-xs text-muted-foreground">
        No configuration options available
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {isCompact && (hasSections || hasHooks) && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left flex items-center justify-between px-3 py-2 rounded hover:bg-muted text-xs font-semibold transition-colors"
        >
          <span>{template.name}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {(!isCompact || isExpanded) && (
        <div className="flex flex-col gap-3">
          {hasSections && (
            <div className="flex flex-col gap-2">
              {!isCompact && (
                <Label className="text-xs font-semibold text-foreground">
                  Configuration
                </Label>
              )}
              <DynamicForm
                definition={template.definition}
                values={terraformVariables}
                onChange={setTerraformVariables}
              />
            </div>
          )}

          {hasHooks && (
            <div className="flex flex-col gap-2">
              {!isCompact && (
                <Label className="text-xs font-semibold text-foreground">
                  Lifecycle Hooks
                </Label>
              )}
              <LifecycleHooksForm
                hooks={template.definition.lifecycle_hooks}
                values={lifecycleHooks}
                onChange={setLifecycleHooks}
                isCompact={isCompact}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
