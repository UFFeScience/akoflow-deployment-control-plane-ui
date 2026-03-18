"use client"

import { useState, useMemo, useEffect, FC } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import TemplateHierarchyForm from "./template-hierarchy-form"

interface EnvironmentTemplateHierarchyFormProps {
  templates?: Array<{ id: string; name: string; description?: string }>
  onLoad?: (data: { templateId: string; values: Record<string, any> }) => void
}

const EnvironmentTemplateHierarchyForm: FC<EnvironmentTemplateHierarchyFormProps> = ({ templates = [], onLoad }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateVersion, setTemplateVersion] = useState<any>(null)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, any>>({})

  const selectedTemplate = useMemo(() => {
    return templates?.find((t) => t.id === selectedTemplateId)
  }, [templates, selectedTemplateId])

  const templateStructure = useMemo(() => {
    if (!templateVersion?.definition_json) return null

    const def = templateVersion.definition_json
    return {
      definition: def,
      clusterTopology: def.cluster_topology || null,
    }
  }, [templateVersion])

  useEffect(() => {
    if (!templateVersion?.definition_json) return

    const def = templateVersion.definition_json

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

    const nextValues: Record<string, unknown> = {}
    if (def.environment_configuration?.sections) {
      nextValues.environment = buildDefaults(def.environment_configuration.sections)
    }

    Object.entries(def.instance_configurations || {}).forEach(([slug, cfg]: [string, any]) => {
      nextValues[slug] = buildDefaults(cfg.sections || [])
      if (def.cluster_topology?.instance_groups) {
        const topo = def.cluster_topology.instance_groups.find(
          (g: any) => (g.instance_group_template_slug || g.name) === slug
        )
        if (topo?.quantity) {
          ;(nextValues[slug] as Record<string, unknown>).__quantity = topo.quantity
        }
      }
    })

    setFormValues(nextValues)
  }, [templateVersion])

  const handleLoadTemplate = async () => {
    if (!selectedTemplateId) return

    try {
      setIsLoadingTemplate(true)
      const response = await fetch(`/api/environment-templates/${selectedTemplateId}/active`)
      const data = await response.json()
      setTemplateVersion(data)
    } catch (error) {
      console.error("Failed to load template:", error)
    } finally {
      setIsLoadingTemplate(false)
    }
  }

  const handleSubmit = () => {
    if (!selectedTemplateId) return
    onLoad?.({
      templateId: selectedTemplateId,
      values: formValues,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Environment Template</CardTitle>
          <CardDescription>Choose a template to configure your AkoFlow cluster</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Label htmlFor="template-select" className="text-sm font-medium">
              Template *
            </Label>
            <Select value={selectedTemplateId || ""} onValueChange={setSelectedTemplateId}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder="Choose a template..." />
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
          <Button onClick={handleLoadTemplate} disabled={!selectedTemplateId || isLoadingTemplate} className="w-full">
            {isLoadingTemplate ? "Loading..." : "Load Configuration"}
          </Button>
        </CardContent>
      </Card>

      {selectedTemplate && templateStructure && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
              {selectedTemplate.description && <CardDescription>{selectedTemplate.description}</CardDescription>}
            </CardHeader>
          </Card>

          <TemplateHierarchyForm
            definition={templateStructure.definition}
            clusterTopology={templateStructure.clusterTopology}
            values={formValues}
            onChange={setFormValues}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTemplateId(null)
                setTemplateVersion(null)
                setFormValues({})
              }}
            >
              Change Template
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Load Configuration
            </Button>
          </div>
        </>
      )}

      {selectedTemplateId && !templateStructure && !isLoadingTemplate && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Template Structure Invalid</p>
                <p className="text-xs mt-1">The selected template does not have a valid configuration structure.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnvironmentTemplateHierarchyForm
