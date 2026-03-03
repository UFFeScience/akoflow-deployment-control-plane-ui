"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { experimentsApi } from "@/lib/api/experiments"
import { templatesApi } from "@/lib/api/templates"
import { providersApi } from "@/lib/api/providers"
import { instanceTypesApi } from "@/lib/api/instance-types"
import { instanceGroupTemplatesApi } from "@/lib/api/instance-group-templates"
import { clustersApi } from "@/lib/api/clusters"
import type { InstanceType, Provider, Template } from "@/lib/api/types"
import { ClusterFormFields, type ClusterFormData } from "./cluster-form-fields"
import { useTemplateDefinition } from "@/hooks/use-template-definition"
import { DynamicForm } from "@/components/form/dynamic-form"
import { ExperimentConfigurationForm } from "@/components/form/experiment-configuration-form"
import { InstanceConfigurationForm } from "@/components/form/instance-configuration-form"
import { LifecycleHooksForm } from "@/components/form/lifecycle-hooks-form"
import { toast } from "sonner"

const steps = [
  {
    id: "basics",
    title: "Basics",
    description: "Name, description, and mode",
  },
  {
    id: "template",
    title: "Experiment template",
    description: "Pick a template and version",
  },
  {
    id: "config",
    title: "Configuration",
    description: "Template variables and lifecycle hooks",
  },
  {
    id: "cluster",
    title: "Cluster & instances",
    description: "Template, provider, and groups",
  },
] as const

type StepId = (typeof steps)[number]["id"]

export function ExperimentCreateFlow() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()

  const [experimentId, setExperimentId] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<StepId>("basics")
  const [templates, setTemplates] = useState<Template[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [instanceTypes, setInstanceTypes] = useState<InstanceType[]>([])
  const [instanceGroupTemplates, setInstanceGroupTemplates] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [basics, setBasics] = useState<{
    name: string
    description: string
    executionMode: "manual" | "auto"
  }>({
    name: "",
    description: "",
    executionMode: "manual",
  })
  const [experimentTemplateId, setExperimentTemplateId] = useState<string>("none")
  const [experimentVariables, setExperimentVariables] = useState<Record<string, unknown>>({})
  const [instanceVariables, setInstanceVariables] = useState<Record<string, unknown>>({})
  const [lifecycleHooks, setLifecycleHooks] = useState<Record<string, string>>({})
  
  const { definition, isLoading: isLoadingDefinition } = useTemplateDefinition(
    experimentTemplateId === "none" ? null : experimentTemplateId
  )
  
  const [clusterForm, setClusterForm] = useState<ClusterFormData>({
    providerId: "",
    region: "",
    instanceGroups: [
      {
        id: crypto.randomUUID(),
        instanceTypeId: "",
        role: "",
        quantity: 1,
        metadata: "",
      },
    ],
  })

  const instanceGroupTemplatesBySlug = useMemo(() => {
    const map: Record<string, string> = {}
    instanceGroupTemplates.forEach((tpl) => {
      map[tpl.slug] = tpl.id
    })
    return map
  }, [instanceGroupTemplates])

  const instanceTypesByProvider = useMemo(() => {
    const map: Record<string, InstanceType[]> = {}
    instanceTypes.forEach((type) => {
      const pid = (type as any).providerId || (type as any).provider_id || (type as any).providerId || type.providerId
      if (pid) {
        if (!map[pid]) map[pid] = []
        map[pid].push(type)
      }
    })
    return map
  }, [instanceTypes])

  const buildDefaultsFromSections = (sections: Array<{ fields?: Array<{ name: string; default?: unknown }> }> = []) => {
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
    let active = true

    async function load() {
      setIsLoadingData(true)
      try {
        const [templateData, providerData, instanceTypeData, instanceGroupTemplateData] = await Promise.all([
          templatesApi.list().catch(() => []),
          providersApi.list().catch(() => []),
          instanceTypesApi.list().catch(() => []),
          instanceGroupTemplatesApi.list().catch(() => []),
        ])
        if (!active) return
        setTemplates(templateData)
        setProviders(providerData)
        setInstanceTypes(instanceTypeData)
        setInstanceGroupTemplates(instanceGroupTemplateData.map((t) => ({ id: t.id, name: t.name, slug: t.slug })))

        const firstHealthy = providerData.find((p) => p.status !== "DOWN")
        if (firstHealthy) {
          setClusterForm((prev) => ({ ...prev, providerId: prev.providerId || firstHealthy.id }))
        }
      } catch {
        if (active) {
          setTemplates([])
          setProviders([])
          setInstanceTypes([])
          setInstanceGroupTemplates([])
        }
      } finally {
        if (active) setIsLoadingData(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  // Prefill cluster form from experiment template topology (e.g., AkoFlow + GKE)
  useEffect(() => {
    if (experimentTemplateId === "none") return
    if (!definition?.cluster_topology?.instance_groups) return

    // Avoid overriding if user already configured groups with templates
    const hasConfiguredGroups = clusterForm.instanceGroups.some(
      (g) => g.instanceGroupTemplateId || g.instanceTypeId
    )
    if (hasConfiguredGroups) return

    // Choose provider: prefer GCP for akoflow-gke, else first available
    const gcpProvider = providers.find((p) => p.name?.toUpperCase() === "GCP")
    const provider = gcpProvider || providers[0]
    if (!provider) return

    const regionFromVars = (experimentVariables as any)?.gcp_region || "us-central1"
    const providerTypes = instanceTypesByProvider[provider.id] || instanceTypes

    const groups = definition.cluster_topology.instance_groups.map((group: any) => {
      const slug = group.instance_group_template_slug || group.instance_group_template_id || group.name
      const templateId = instanceGroupTemplatesBySlug[slug] || ""
      const instanceTypeId = providerTypes[0]?.id || ""
      const cfg = (definition as any).instance_configurations?.[slug]
      const cfgDefaults = cfg ? buildDefaultsFromSections(cfg.sections || []) : {}
      const terraformDefaults = {
        ...cfgDefaults,
        ...(group.default_terraform_variables || {}),
      }
      return {
        id: crypto.randomUUID(),
        instanceTypeId,
        instanceGroupTemplateId: templateId,
        role: group.name,
        quantity: group.quantity || 1,
        metadata: "",
        terraformVariables: terraformDefaults,
        lifecycleHooks: {},
      }
    })

    setClusterForm((prev) => ({
      ...prev,
      providerId: provider.id,
      region: regionFromVars,
      instanceGroups: groups,
    }))
  }, [experimentTemplateId, definition, providers, instanceTypes, instanceTypesByProvider, instanceGroupTemplatesBySlug, experimentVariables, clusterForm.instanceGroups])

  function nextStep() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    const next = steps[idx + 1]
    if (next) {
      // Se saindo do step de config, salvar as variáveis do experimento
      if (activeStep === "config" && !experimentId) {
        handleSaveConfiguration()
      }
      setActiveStep(next.id)
    }
  }

  function prevStep() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    const prev = steps[idx - 1]
    if (prev) setActiveStep(prev.id)
  }

  function canProceed(step: StepId) {
    if (step === "basics") return basics.name.trim().length > 0
    if (step === "template") return true
    if (step === "config") {
      // Config step is always allowed (fields are optional if template is "none")
      return true
    }
    const hasGroups = clusterForm.instanceGroups.some((g) => g.instanceTypeId && g.quantity > 0)
    return Boolean(clusterForm.providerId && clusterForm.region && hasGroups)
  }

  async function handleSaveConfiguration() {
    // Se o experimento ainda não foi criado, criá-lo com as configurações
    if (!experimentId) {
      try {
        const experimentPayload = {
          name: basics.name.trim(),
          description: basics.description.trim() || undefined,
          execution_mode: basics.executionMode,
          template_version_id: experimentTemplateId === "none" ? undefined : experimentTemplateId,
          ...(Object.keys(experimentVariables).length > 0 && { experiment_variables: experimentVariables }),
          ...(Object.keys(instanceVariables).length > 0 && { instance_variables: instanceVariables }),
          ...(Object.keys(lifecycleHooks).length > 0 && { lifecycle_hooks: lifecycleHooks }),
        }

        const experiment = await experimentsApi.create(projectId, experimentPayload)
        setExperimentId(experiment.id)
        toast.success("Configuration saved successfully")
      } catch (error) {
        toast.error("Failed to save configuration")
        throw error
      }
    }
  }

  async function handleFinish() {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Usar experimentId se já foi criado, senão criar agora
      let finalExperimentId = experimentId

      if (!finalExperimentId) {
        // Merge experiment and instance variables
        const terraformVariables = {
          ...experimentVariables,
          ...instanceVariables,
        }

        const experimentPayload = {
          name: basics.name.trim(),
          description: basics.description.trim() || undefined,
          execution_mode: basics.executionMode,
          template_version_id: experimentTemplateId === "none" ? undefined : experimentTemplateId,
          ...(Object.keys(experimentVariables).length > 0 && { experiment_variables: experimentVariables }),
          ...(Object.keys(instanceVariables).length > 0 && { instance_variables: instanceVariables }),
          ...(Object.keys(terraformVariables).length > 0 && { terraform_variables: terraformVariables }),
          ...(Object.keys(lifecycleHooks).length > 0 && { lifecycle_hooks: lifecycleHooks }),
        }

        const experiment = await experimentsApi.create(projectId, experimentPayload)
        finalExperimentId = experiment.id
      }

      const instanceGroupsPayload = [] as {
        instanceTypeId: string
        instanceGroupTemplateId?: string
        role?: string
        quantity: number
        metadata?: Record<string, unknown>
        terraformVariables?: Record<string, unknown>
        lifecycleHooks?: Record<string, string>
      }[]

      for (const group of clusterForm.instanceGroups.filter((g) => g.instanceTypeId && g.quantity > 0)) {
        let metadata: Record<string, unknown> | undefined

        if (group.metadata.trim()) {
          try {
            metadata = JSON.parse(group.metadata)
          } catch {
            toast.error(`Invalid metadata JSON in group ${group.role || group.instanceTypeId}`)
            setIsSubmitting(false)
            return
          }
        }

        instanceGroupsPayload.push({
          instanceTypeId: group.instanceTypeId,
          instanceGroupTemplateId: group.instanceGroupTemplateId || undefined,
          role: group.role || undefined,
          quantity: group.quantity,
          metadata,
          ...(group.terraformVariables && Object.keys(group.terraformVariables).length > 0 && { terraformVariables: group.terraformVariables }),
          ...(group.lifecycleHooks && Object.keys(group.lifecycleHooks).length > 0 && { lifecycleHooks: group.lifecycleHooks }),
        })
      }

      if (instanceGroupsPayload.length > 0 && clusterForm.providerId && clusterForm.region) {
        const nodeCount = instanceGroupsPayload.reduce((sum, g) => sum + g.quantity, 0)
        await clustersApi.create(finalExperimentId, {
          providerId: clusterForm.providerId,
          region: clusterForm.region,
          instanceGroups: instanceGroupsPayload,
          nodeCount,
        })
      }

      toast.success("Experiment created")
      router.push(`/projects/${projectId}/experiments/${finalExperimentId}`)
    } catch {
      toast.error("Failed to create experiment")
      setIsSubmitting(false)
    }
  }

  const activeIdx = steps.findIndex((s) => s.id === activeStep)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 h-6 px-2 text-xs text-muted-foreground" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to project
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Guided experiment setup
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex flex-wrap gap-2">
          {steps.map((step, idx) => {
            const isDone = idx < activeIdx
            const isActive = step.id === activeStep
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : isDone
                      ? "border-emerald-400/60 bg-emerald-50/20 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isActive ? "bg-primary text-white" : isDone ? "bg-emerald-500 text-white" : "bg-muted text-foreground"
                }`}>
                  {isDone ? <Check className="h-3 w-3" /> : idx + 1}
                </span>
                <span>
                  <div className="text-xs font-semibold">{step.title}</div>
                  <div className="text-[11px] text-muted-foreground">{step.description}</div>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background/50 p-4 shadow-sm">
        {activeStep === "basics" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Experiment basics</h2>
              <p className="text-xs text-muted-foreground">Name, description, and execution mode.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="Distributed training on AWS/GCP"
                  value={basics.name}
                  onChange={(e) => setBasics((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Execution mode</Label>
                <Select
                  value={basics.executionMode}
                  onValueChange={(v: "manual" | "auto") => setBasics((prev) => ({ ...prev, executionMode: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual" className="text-xs">Manual</SelectItem>
                    <SelectItem value="auto" className="text-xs">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                className="text-sm"
                rows={4}
                placeholder="What are we testing? Include datasets, targets, or constraints."
                value={basics.description}
                onChange={(e) => setBasics((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        )}

        {activeStep === "template" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Experiment template</h2>
              <p className="text-xs text-muted-foreground">Pick a template to prefill defaults and metadata.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setExperimentTemplateId("none")}
                className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
                  experimentTemplateId === "none" ? "border-primary/60 bg-primary/5" : "border-border bg-background"
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                  No template
                  {experimentTemplateId === "none" && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Start from scratch and configure clusters manually.
                </p>
              </button>
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setExperimentTemplateId(template.id)}
                  className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
                    experimentTemplateId === template.id ? "border-primary/60 bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    {template.name}
                    {experimentTemplateId === template.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{template.description}</p>
                  )}
                  {template.latestVersion && (
                    <span className="text-[11px] text-muted-foreground">v{template.latestVersion}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeStep === "config" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Template configuration</h2>
              <p className="text-xs text-muted-foreground">
                {definition
                  ? "Configure experiment and instance settings."
                  : "Select a template in the previous step to configure variables."}
              </p>
            </div>

            {definition && (
              <div className="flex flex-col gap-6">
                {/* Experiment Configuration Section */}
                {(definition as any).experiment_configuration && (
                  <ExperimentConfigurationForm
                    definition={definition}
                    values={experimentVariables}
                    onChange={setExperimentVariables}
                  />
                )}

                {/* Instance Configuration Section */}
                {(definition as any).instance_configurations &&
                  Object.keys((definition as any).instance_configurations).length > 0 && (
                    <InstanceConfigurationForm
                      definition={definition}
                      values={instanceVariables}
                      onChange={setInstanceVariables}
                    />
                  )}

                {/* Fallback to original DynamicForm for backward compatibility */}
                {!(definition as any).experiment_configuration &&
                  !(definition as any).instance_configurations &&
                  definition.sections &&
                  definition.sections.length > 0 && (
                    <div>
                      <DynamicForm
                        definition={definition}
                        values={experimentVariables}
                        onChange={setExperimentVariables}
                      />
                    </div>
                  )}

                {definition.lifecycle_hooks && definition.lifecycle_hooks.length > 0 && (
                  <div>
                    <LifecycleHooksForm
                      definition={definition}
                      values={lifecycleHooks}
                      onChange={setLifecycleHooks}
                    />
                  </div>
                )}

                {!(definition as any).experiment_configuration &&
                  !(definition as any).instance_configurations &&
                  (!definition.sections || definition.sections.length === 0) &&
                  (!definition.lifecycle_hooks || definition.lifecycle_hooks.length === 0) && (
                    <div className="text-sm text-muted-foreground">
                      This template has no additional configuration options.
                    </div>
                  )}
              </div>
            )}

            {!definition && experimentTemplateId !== "none" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading configuration...
              </div>
            )}

            {experimentTemplateId === "none" && (
              <div className="text-sm text-muted-foreground">
                No template selected. Proceed to cluster configuration or select a template.
              </div>
            )}
          </div>
        )}

        {activeStep === "cluster" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Cluster & instances</h2>
              <p className="text-xs text-muted-foreground">Define provider, template, region, and instance groups.</p>
            </div>

            <ClusterFormFields
              form={clusterForm}
              onFormChange={setClusterForm}
              providers={providers}
              instanceTypes={instanceTypes}
              instanceGroupTemplates={instanceGroupTemplates}
              isCompact={true}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[11px] text-muted-foreground">
          Step {activeIdx + 1} of {steps.length}
        </div>
        <div className="flex items-center gap-2">
          {activeStep !== "basics" && (
            <Button variant="outline" size="sm" className="text-xs" onClick={prevStep}>
              Back
            </Button>
          )}
          {activeStep !== "cluster" && (
            <Button
              size="sm"
              className="text-xs"
              onClick={nextStep}
              disabled={!canProceed(activeStep)}
            >
              Continue
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
          {activeStep === "cluster" && (
            <Button
              size="sm"
              className="text-xs"
              onClick={handleFinish}
              disabled={isSubmitting || !canProceed("cluster")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create experiment"
              )}
            </Button>
          )}
        </div>
      </div>

      {isLoadingData && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading templates and providers...
        </div>
      )}
    </div>
  )
}
