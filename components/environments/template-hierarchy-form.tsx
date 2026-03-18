"use client"

import { FC, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { TemplateClusterTopology, TemplateDefinition, TemplateInstanceConfiguration } from "@/lib/api/types"

interface Field {
  name: string
  label: string
  type: string
  required?: boolean
  default?: unknown
  description?: string
  options?: Array<{ label: string; value: string }>
  min?: number
  max?: number
}

interface Section {
  name: string
  label: string
  description?: string
  fields: Field[]
}

interface TemplateHierarchyFormProps {
  definition: TemplateDefinition | null
  clusterTopology?: TemplateClusterTopology | null
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
}

const TemplateHierarchyForm: FC<TemplateHierarchyFormProps> = ({ definition, clusterTopology, values = {}, onChange }) => {
  const environmentSections = useMemo(() => {
    if (!definition) return []
    if (definition.environment_configuration?.sections?.length) return definition.environment_configuration.sections
    return definition.sections || []
  }, [definition])

  const instanceGroupConfigs = useMemo<Record<string, TemplateInstanceConfiguration>>(() => {
    return definition?.instance_configurations || {}
  }, [definition])

  const orderedGroups = useMemo(() => {
    const topologyGroups = clusterTopology?.instance_groups || []
    if (topologyGroups.length === 0) {
      return Object.entries(instanceGroupConfigs).map(([slug, config]) => ({ slug, config, topology: null }))
    }
    return topologyGroups.map((group) => {
      const slug = group.instance_group_template_slug || group.instance_group_template_id || group.name
      return {
        slug,
        config: instanceGroupConfigs[slug] || {
          label: group.label,
          description: group.description,
          sections: [],
        },
        topology: group,
      }
    })
  }, [clusterTopology, instanceGroupConfigs])

  const handleChange = (path: string, value: unknown) => {
    const keys = path.split(".")
    const newValues = JSON.parse(JSON.stringify(values))

    let current = newValues
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value

    onChange(newValues)
  }

  const renderField = (field: Field, value: unknown, onChange: (v: unknown) => void) => {
    switch (field.type) {
      case "string":
      case "number":
        return (
          <Input
            type={field.type === "number" ? "number" : "text"}
            className="h-9"
            placeholder={field.description}
            value={String(value ?? field.default ?? "")}
            onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
            min={field.min}
            max={field.max}
          />
        )
      case "text":
      case "script":
        return (
          <textarea
            className="h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={field.description}
            value={String(value ?? field.default ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={(value as boolean) ?? (field.default as boolean) ?? false}
              onCheckedChange={(checked) => onChange(checked === true)}
            />
            <span className="text-sm text-muted-foreground">{field.description}</span>
          </div>
        )
      case "select":
        return (
          <Select value={String(value ?? field.default ?? "")} onValueChange={onChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {environmentSections.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full" />
            <h3 className="font-semibold text-base">Environment Configuration</h3>
          </div>
          <div className="flex flex-col gap-4">
            {environmentSections.map((section) => (
              <Card key={section.name} className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{section.label}</CardTitle>
                  {section.description && <CardDescription className="text-xs">{section.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {section.fields.map((field) => (
                      <div key={field.name} className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {renderField(
                          field,
                          (values.environment || {})[field.name],
                          (v) => handleChange(`environment.${field.name}`, v)
                        )}
                        {field.description && field.type !== "boolean" && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {orderedGroups.map(({ slug, config, topology }) => (
        <div key={slug} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 ${slug === "gke-compute" ? "bg-emerald-600" : "bg-orange-600"} rounded-full`} />
            <h3 className="font-semibold text-base">{config.label}</h3>
          </div>
          <div className="flex flex-col gap-2">
            {config.description && <p className="text-sm text-muted-foreground">{config.description}</p>}
            {topology && (
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Quantity</span>
                <Input
                  type="number"
                  min={1}
                  value={Number((values[slug] || {}).__quantity ?? topology.quantity ?? 1)}
                  onChange={(e) => handleChange(`${slug}.__quantity`, Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 w-32"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {config.sections.map((section) => (
              <Card key={section.name} className={`border-${slug === "gke-compute" ? "emerald" : "orange"}-200`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{section.label}</CardTitle>
                  {section.description && <CardDescription className="text-xs">{section.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {section.fields.map((field) => (
                      <div key={field.name} className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {renderField(
                          field,
                          (values[slug] || {})[field.name],
                          (v) => handleChange(`${slug}.${field.name}`, v)
                        )}
                        {field.description && field.type !== "boolean" && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TemplateHierarchyForm
