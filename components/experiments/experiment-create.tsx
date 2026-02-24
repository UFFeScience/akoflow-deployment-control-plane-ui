"use client"

import { useEffect, useState } from "react"
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
import { clustersApi } from "@/lib/api/clusters"
import type { InstanceType, Provider, Template } from "@/lib/api/types"
import { ClusterFormFields, type ClusterFormData } from "./cluster-form-fields"
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

  const [activeStep, setActiveStep] = useState<StepId>("basics")
  const [templates, setTemplates] = useState<Template[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [instanceTypes, setInstanceTypes] = useState<InstanceType[]>([])
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
  const [clusterForm, setClusterForm] = useState<ClusterFormData>({
    templateId: "none",
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

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoadingData(true)
      try {
        const [templateData, providerData, instanceTypeData] = await Promise.all([
          templatesApi.list().catch(() => []),
          providersApi.list().catch(() => []),
          instanceTypesApi.list().catch(() => []),
        ])
        if (!active) return
        setTemplates(templateData)
        setProviders(providerData)
        setInstanceTypes(instanceTypeData)

        const firstHealthy = providerData.find((p) => p.status !== "DOWN")
        if (firstHealthy) {
          setClusterForm((prev) => ({ ...prev, providerId: prev.providerId || firstHealthy.id }))
        }
      } catch {
        if (active) {
          setTemplates([])
          setProviders([])
          setInstanceTypes([])
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

  function nextStep() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    const next = steps[idx + 1]
    if (next) setActiveStep(next.id)
  }

  function prevStep() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    const prev = steps[idx - 1]
    if (prev) setActiveStep(prev.id)
  }

  function canProceed(step: StepId) {
    if (step === "basics") return basics.name.trim().length > 0
    if (step === "template") return true
    const hasGroups = clusterForm.instanceGroups.some((g) => g.instanceTypeId && g.quantity > 0)
    return Boolean(clusterForm.providerId && clusterForm.region && hasGroups)
  }

  async function handleFinish() {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const experiment = await experimentsApi.create(projectId, {
        name: basics.name.trim(),
        description: basics.description.trim() || undefined,
        templateId: experimentTemplateId === "none" ? undefined : experimentTemplateId,
        executionMode: basics.executionMode,
      })

      const instanceGroupsPayload = [] as {
        instanceTypeId: string
        role?: string
        quantity: number
        metadata?: Record<string, unknown>
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
          role: group.role || undefined,
          quantity: group.quantity,
          metadata,
        })
      }

      if (instanceGroupsPayload.length > 0 && clusterForm.providerId && clusterForm.region) {
        const nodeCount = instanceGroupsPayload.reduce((sum, g) => sum + g.quantity, 0)
        await clustersApi.create(experiment.id, {
          templateId: clusterForm.templateId === "none" ? undefined : clusterForm.templateId,
          providerId: clusterForm.providerId,
          region: clusterForm.region,
          instanceGroups: instanceGroupsPayload,
          nodeCount,
        })
      }

      toast.success("Experiment created")
      router.push(`/projects/${projectId}/experiments/${experiment.id}`)
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
              templates={templates}
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
