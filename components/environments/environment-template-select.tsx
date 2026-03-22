"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEnvironmentTemplates, useEnvironmentTemplateActive } from "@/hooks/use-environment-templates"
import TemplateHierarchyForm from "./template-hierarchy-form"

interface InstanceGroupItem {
  id: string
  instanceTypeId: string
  instanceGroupTemplateId?: string
  role: string
  quantity: number
  metadata: string
  terraformVariables?: Record<string, unknown>
  lifecycleHooks?: Record<string, string>
}

interface EnvironmentTemplateSelectProps {
  onTemplateSelected: (data: {
    environmentTemplateVersionId: string
    environmentLevelVariables: Record<string, unknown>
    instanceGroups: InstanceGroupItem[]
  }) => void
  instanceTypes: Array<{ id: string; name: string }>
}

export function EnvironmentTemplateSelect({
  onTemplateSelected,
  instanceTypes,
}: EnvironmentTemplateSelectProps) {
  const { templates, isLoading: templatesLoading } = useEnvironmentTemplates()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const { template, isLoading: templateLoading } = useEnvironmentTemplateActive(selectedTemplateId)
  const [templateValues, setTemplateValues] = useState<Record<string, any>>({})
  const [isConfirmed, setIsConfirmed] = useState(false)

  const definition = useMemo(() => template?.definition_json, [template])

  // Auto-select AkoFlow+GKE template when available so the default environment starts with GKE(3) + AkoFlow(1)
  useEffect(() => {
    if (selectedTemplateId || templates.length === 0) return
    const akoflowGke = templates.find((t) => t.slug === "akoflow-gke")
    if (akoflowGke) {
      setSelectedTemplateId(akoflowGke.id)
    }
  }, [templates, selectedTemplateId])

  useEffect(() => {
    if (!definition) return

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

    const nextValues: Record<string, any> = {}
    if (definition.environment_configuration?.sections) {
      nextValues.environment = buildDefaults(definition.environment_configuration.sections)
    }

    Object.entries(definition.instance_configurations || {}).forEach(([slug, cfg]: [string, any]) => {
      nextValues[slug] = buildDefaults(cfg.sections || [])
    })

    if (definition.cluster_topology?.instance_groups) {
      definition.cluster_topology.instance_groups.forEach((group: any) => {
        const slug = group.instance_group_template_slug || group.instance_group_template_id || group.name
        if (!nextValues[slug]) nextValues[slug] = {}
        nextValues[slug].__quantity = group.quantity || 1
      })
    }

    setTemplateValues(nextValues)
  }, [definition])

  function handleSelect() {
    if (!template) return

    // Get instance groups from template
    const instanceGroups: InstanceGroupItem[] = []
    const topologyGroups = template.definition_json?.cluster_topology?.instance_groups || []

    for (const group of topologyGroups) {
      const slug = group.instance_group_template_slug || group.instance_group_template_id || group.name
      const templateId = group.instance_group_template_id || group.instance_group_template_slug || slug
      
      // Use first instance type of the correct provider if available
      const instanceTypeId = instanceTypes[0]?.id || ""

      const defaultVars = group.default_terraform_variables || {}
      const instanceValues = (templateValues as any)[slug] || (templateValues as any)[templateId] || {}
      const { __quantity, ...userTerraform } = instanceValues
      const quantity = Number(__quantity ?? group.quantity ?? 1)

      instanceGroups.push({
        id: crypto.randomUUID(),
        instanceTypeId,
        role: `${group.name}`,
        quantity: Number.isFinite(quantity) ? quantity : 1,
        metadata: "",
        instanceGroupTemplateId: templateId,
        terraformVariables: { ...defaultVars, ...userTerraform },
        lifecycleHooks: {},
      })
    }

    onTemplateSelected({
      environmentTemplateVersionId: template.id,
      environmentLevelVariables: (templateValues as any).environment || {},
      instanceGroups,
    })

    setIsConfirmed(true)
  }

  if (isConfirmed && template) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{template.definition_json?.cluster_topology?.description || "Template loaded"}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsConfirmed(false)
                setTemplateValues({})
              }}
            >
              Change
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Load from Environment Template</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Select Template</Label>
          <Select value={selectedTemplateId || ""} onValueChange={setSelectedTemplateId}>
            <SelectTrigger disabled={templatesLoading}>
              <SelectValue placeholder="Choose an environment template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {templateLoading && selectedTemplateId && (
          <div className="text-xs text-muted-foreground">Loading template configuration...</div>
        )}

        {template && !templateLoading && definition && (
          <>
            <TemplateHierarchyForm
              definition={definition}
              clusterTopology={definition.cluster_topology || null}
              values={templateValues}
              onChange={setTemplateValues}
            />

            <Button onClick={handleSelect} className="w-full">
              Load Template &amp; Create Instance Groups
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
