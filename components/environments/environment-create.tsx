"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowRight, Check, Cloud, Sparkles } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { environmentsApi } from "@/lib/api/environments"
import { templatesApi } from "@/lib/api/templates"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import type { Provider, ProviderCredential, Template, TemplateVersion } from "@/lib/api/types"
import { DeploymentFormFields, multiFormToPayload, type DeploymentFormData, type MultiProviderFormData } from "./deployment-form-fields"
import { useTemplateDefinition } from "@/hooks/use-template-definition"
import { DynamicForm } from "@/components/form/dynamic-form"
import { EnvironmentConfigurationForm } from "@/components/form/environment-configuration-form"
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
    title: "Environment template",
    description: "Pick a template and version",
  },
  {
    id: "config",
    title: "Configuration",
    description: "Provider, template variables and lifecycle hooks",
  },
  {
    id: "deployment",
    title: "Deployment",
    description: "Credentials for selected providers",
  },
] as const

type StepId = (typeof steps)[number]["id"]

export function EnvironmentCreateFlow() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()
  const { currentOrg } = useAuth()

  const [activeStep, setActiveStep] = useState<StepId>("basics")
  const [templates, setTemplates] = useState<Template[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [credentials, setCredentials] = useState<ProviderCredential[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({})
  const [showConfigErrors, setShowConfigErrors] = useState(false)

  const [basics, setBasics] = useState<{
    name: string
    description: string
    executionMode: "manual" | "auto"
  }>({
    name: "",
    description: "",
    executionMode: "manual",
  })
  const [environmentTemplateId, setEnvironmentTemplateId] = useState<string>("none")
  const [templateVersions, setTemplateVersions] = useState<TemplateVersion[]>([])
  const [selectedTemplateVersionId, setSelectedTemplateVersionId] = useState<string | null>(null)
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)
  const [environmentVariables, setEnvironmentVariables] = useState<Record<string, unknown>>({})
  const [lifecycleHooks, setLifecycleHooks] = useState<Record<string, string>>({})

  useEffect(() => {
    if (environmentTemplateId === "none") {
      setTemplateVersions([])
      setSelectedTemplateVersionId(null)
      return
    }
    let active = true
    setIsLoadingVersions(true)
    templatesApi.listVersions(environmentTemplateId)
      .then((vers) => {
        if (!active) return
        setTemplateVersions(vers)
        const activeVer = vers.find((v) => v.is_active) ?? vers[0]
        setSelectedTemplateVersionId(activeVer?.id ? String(activeVer.id) : null)
      })
      .catch(() => {})
      .finally(() => { if (active) setIsLoadingVersions(false) })
    return () => { active = false }
  }, [environmentTemplateId])

  const { definition, activeVersionId, isLoading: isLoadingDefinition } = useTemplateDefinition(
    environmentTemplateId === "none" ? null : environmentTemplateId,
    selectedTemplateVersionId,
  )

  // Derived from template definition
  const availableSlugs = definition?.providers ?? []
  const mandatorySlugs = definition?.required_providers ?? []
  const minProviders = definition?.min_providers ?? (availableSlugs.length > 0 ? 1 : 0)
  const isMultiProvider = availableSlugs.length > 0

  const [deploymentForm, setDeploymentForm] = useState<DeploymentFormData>({
    providerId: "",
    credentialId: "",
  })
  const [multiDeploymentForm, setMultiDeploymentForm] = useState<MultiProviderFormData>({ providerCredentials: {} })
  const [credentialsBySlug, setCredentialsBySlug] = useState<Record<string, ProviderCredential[]>>({})
  const [activeConfigProvider, setActiveConfigProvider] = useState<string>("")
  // Which optional providers the user has toggled on (required ones are always active)
  const [selectedOptionalSlugs, setSelectedOptionalSlugs] = useState<string[]>([])

  // Slugs that will actually be used in this deployment
  const activeSlugs = isMultiProvider
    ? [...new Set([...mandatorySlugs, ...selectedOptionalSlugs.filter((s) => availableSlugs.includes(s))])]
    : []

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoadingData(true)
      try {
        const [templateData, providerData] = await Promise.all([
          templatesApi.list().catch(() => []),
          (currentOrg ? providersApi.list(String(currentOrg.id)) : Promise.resolve([])).catch(() => []),
        ])
        if (!active) return
        setTemplates(templateData)
        setProviders(providerData)

        const firstHealthy = providerData.find((p) => p.status !== "DOWN")
        const defaultProvider = firstHealthy || providerData[0]
        if (defaultProvider && currentOrg) {
          const defaultProviderId = String(defaultProvider.id)
          setDeploymentForm((prev) => ({ ...prev, providerId: prev.providerId || defaultProviderId }))
          providersApi
            .listCredentials(String(currentOrg.id), defaultProviderId)
            .then((credData) => { if (active) setCredentials(credData) })
            .catch(() => { if (active) setCredentials([]) })
        }
      } catch {
        if (active) {
          setTemplates([])
          setProviders([])
        }
      } finally {
        if (active) setIsLoadingData(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload credentials whenever the selected provider changes
  useEffect(() => {
    if (!deploymentForm.providerId || !currentOrg) {
      setCredentials([])
      return
    }
    let active = true
    providersApi
      .listCredentials(String(currentOrg.id), deploymentForm.providerId)
      .then((data) => { if (active) setCredentials(data) })
      .catch(() => { if (active) setCredentials([]) })
    return () => { active = false }
  }, [deploymentForm.providerId, currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync the active config-step provider tab when the template changes
  useEffect(() => {
    if (definition?.providers && definition.providers.length > 0) {
      const slugs = definition.providers
      const mandatory = definition.required_providers ?? []
      // If only one provider available, pre-select it even if optional
      const preselectedOptional =
        slugs.length === 1 && !mandatory.includes(slugs[0]) ? [slugs[0]] : []
      setSelectedOptionalSlugs(preselectedOptional)
      // Keep active tab if still valid, otherwise clear (form shows after selection)
      setActiveConfigProvider((prev) => (prev && slugs.includes(prev) ? prev : ""))
    } else {
      setActiveConfigProvider("")
      setSelectedOptionalSlugs([])
    }
  }, [definition])

  // Keep active config tab valid when activeSlugs changes
  useEffect(() => {
    if (activeSlugs.length === 1) {
      // Auto-select the sole remaining provider
      setActiveConfigProvider(activeSlugs[0])
    } else if (activeSlugs.length > 1 && activeConfigProvider && !activeSlugs.includes(activeConfigProvider)) {
      // Active tab was deselected — clear so empty state shows
      setActiveConfigProvider("")
    } else if (activeSlugs.length === 0) {
      setActiveConfigProvider("")
    }
  }, [activeSlugs]) // eslint-disable-line react-hooks/exhaustive-deps

  // For multi-provider templates, load credentials for every active slug
  useEffect(() => {
    if (!isMultiProvider || !currentOrg || !providers.length) {
      setCredentialsBySlug({})
      return
    }
    let active = true
    Promise.all(
      availableSlugs.map(async (slug) => {
        const match = providers.find(
          (p) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase()
        )
        if (!match) return [slug, [] as ProviderCredential[]] as const
        const creds = await providersApi
          .listCredentials(String(currentOrg.id), String(match.id))
          .catch(() => [] as ProviderCredential[])
        return [slug, creds] as const
      })
    ).then((results) => {
      if (!active) return
      setCredentialsBySlug(Object.fromEntries(results))
      setMultiDeploymentForm((prev) => {
        const updated = { ...prev.providerCredentials }
        for (const slug of availableSlugs) {
          if (!updated[slug]?.providerId) {
            const match = providers.find(
              (p) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase()
            )
            if (match) updated[slug] = { providerId: String(match.id), credentialId: "" }
          }
        }
        return { providerCredentials: updated }
      })
    })
    return () => { active = false }
  }, [isMultiProvider, definition, providers, currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  function validateConfigFields(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!definition) return errors

    // Validate environment_configuration required fields
    const expConfig = (definition as any).environment_configuration
    if (expConfig?.sections) {
      for (const section of expConfig.sections) {
        for (const field of section.fields || []) {
          if (field.required) {
            const val = environmentVariables[field.name] ?? field.default
            if (val === undefined || val === null || val === "") {
              errors[field.name] = `${field.label} is required`
            }
          }
        }
      }
    }

    return errors
  }

  function nextStep() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    const next = steps[idx + 1]
    if (!next) return

    if (activeStep === "config") {
      const errors = validateConfigFields()
      if (Object.keys(errors).length > 0) {
        setConfigErrors(errors)
        setShowConfigErrors(true)
        return
      }
      setConfigErrors({})
      setShowConfigErrors(false)
    }

    setActiveStep(next.id)
  }

  function prevStep() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    const prev = steps[idx - 1]
    if (prev) setActiveStep(prev.id)
  }

  function buildConfigurationJson(): Record<string, unknown> {
    const config: Record<string, unknown> = {}
    if (Object.keys(environmentVariables).length > 0) {
      config.environment_configuration = environmentVariables
    }
    if (Object.keys(lifecycleHooks).length > 0) {
      config.lifecycle_hooks = lifecycleHooks
    }
    return config
  }

  function canProceed(step: StepId) {
    if (step === "basics") return basics.name.trim().length > 0
    if (step === "template") return true
    if (step === "config") {
      if (isMultiProvider && activeSlugs.length < minProviders) return false
      return true
    }
    if (isMultiProvider) {
      const allFilled = activeSlugs.every(
        (slug) =>
          Boolean(multiDeploymentForm.providerCredentials[slug]?.providerId) &&
          Boolean(multiDeploymentForm.providerCredentials[slug]?.credentialId)
      )
      return allFilled
    }
    return Boolean(deploymentForm.providerId && deploymentForm.credentialId)
  }

  async function handleFinish() {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const configurationJson = buildConfigurationJson()

      const providerCredentials = isMultiProvider
        ? multiFormToPayload(multiDeploymentForm).filter((e) => activeSlugs.some((s) => {
            const match = providers.find((p) => p.slug === s || p.type?.toLowerCase() === s.toLowerCase())
            return match && String(match.id) === e.provider_id
          }))
        : deploymentForm.providerId
          ? [{ provider_id: deploymentForm.providerId, credential_id: deploymentForm.credentialId || null }]
          : []
      const hasDeployment = Boolean(providerCredentials.length)

      const payload = {
        name: basics.name.trim(),
        description: basics.description.trim() || undefined,
        execution_mode: basics.executionMode,
        environment_template_version_id: selectedTemplateVersionId ?? activeVersionId ?? undefined,
        ...(Object.keys(configurationJson).length > 0 && { configuration_json: configurationJson }),
        ...(hasDeployment && {
          deployment: {
            provider_credentials: providerCredentials,
          },
        }),
      }

      const result = await environmentsApi.provision(projectId, payload)
      const environmentId = result.id

      toast.success("Environment created")
      router.push(`/projects/${projectId}/environments/${environmentId}`)
    } catch {
      toast.error("Failed to create environment")
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
          Guided environment setup
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
              <h2 className="text-sm font-semibold text-foreground">Environment basics</h2>
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
              <h2 className="text-sm font-semibold text-foreground">Environment template</h2>
              <p className="text-xs text-muted-foreground">Pick a template to prefill defaults and metadata.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setEnvironmentTemplateId("none")}
                className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
                  environmentTemplateId === "none" ? "border-primary/60 bg-primary/5" : "border-border bg-background"
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                  No template
                  {environmentTemplateId === "none" && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Start from scratch and configure deployments manually.
                </p>
              </button>
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setEnvironmentTemplateId(template.id)}
                  className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
                    environmentTemplateId === template.id ? "border-primary/60 bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    {template.name}
                    {environmentTemplateId === template.id && <Check className="h-4 w-4 text-primary" />}
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

            {/* Version selector */}
            {environmentTemplateId !== "none" && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs">
                  Version
                  {isLoadingVersions && <span className="ml-2 text-[10px] text-muted-foreground">Loading…</span>}
                </Label>
                {!isLoadingVersions && templateVersions.length > 0 && (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {templateVersions.map((ver) => (
                      <button
                        key={ver.id}
                        type="button"
                        onClick={() => setSelectedTemplateVersionId(String(ver.id))}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          selectedTemplateVersionId === String(ver.id)
                            ? "border-primary/60 bg-primary/5"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <span className="font-mono font-medium">v{ver.version}</span>
                        <span className="flex items-center gap-1.5">
                          {ver.is_active && (
                            <span className="text-[10px] rounded bg-green-500/10 text-green-600 px-1">active</span>
                          )}
                          {selectedTemplateVersionId === String(ver.id) && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {!isLoadingVersions && templateVersions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No versions found for this template.</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeStep === "config" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Template configuration</h2>
              <p className="text-xs text-muted-foreground">
                {definition
                  ? "Configure environment and instance settings."
                  : "Select a template in the previous step to configure variables."}
              </p>
            </div>

            {definition && (
              <div className="flex flex-col gap-6">
                {/* Provider selection — required/optional */}
                {isMultiProvider && availableSlugs.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-foreground">Cloud providers</p>
                    {minProviders > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Required providers are always included. Enable optional ones you also want to deploy to.
                        {activeSlugs.length < minProviders && (
                          <span className="ml-1 text-amber-600 font-medium">
                            At least {minProviders} provider{minProviders > 1 ? "s" : ""} must be selected
                            {` (${activeSlugs.length}/${minProviders} selected)`}.
                          </span>
                        )}
                      </p>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {availableSlugs.map((slug) => {
                        const isMandatory = mandatorySlugs.includes(slug)
                        const isSelected = isMandatory || selectedOptionalSlugs.includes(slug)
                        return (
                          <label
                            key={slug}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                              isSelected ? "border-primary/50 bg-primary/5" : "border-border bg-background"
                            } ${isMandatory ? "cursor-default" : "cursor-pointer"}`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={isSelected}
                              disabled={isMandatory}
                              onChange={() => {
                                if (isMandatory) return
                                setSelectedOptionalSlugs((prev) =>
                                  prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
                                )
                              }}
                            />
                            <span className="flex-1">
                              <span className="text-xs font-semibold uppercase tracking-wide">{slug}</span>
                            </span>
                            {isMandatory && (
                              <span className="text-[11px] rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 px-1.5 py-0.5 font-medium">required</span>
                            )}
                            {!isMandatory && (
                              <span className="text-[11px] text-muted-foreground">optional</span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Provider tabs — filter config fields by active (selected) providers */}
                {activeSlugs.length > 0 && (
                  <div className="flex items-center gap-0 border-b border-border">
                    {activeSlugs.map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => setActiveConfigProvider(slug)}
                        className={`relative px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                          activeConfigProvider === slug
                            ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty state — no provider selected yet */}
                {isMultiProvider && activeSlugs.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/10 py-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Cloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">No provider selected</p>
                      <p className="text-xs text-muted-foreground mt-1">Select at least one cloud provider above to configure its settings.</p>
                    </div>
                  </div>
                )}

                {/* Empty state — provider selected but no tab active */}
                {isMultiProvider && activeSlugs.length > 0 && !activeConfigProvider && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/10 py-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Cloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Choose a provider tab</p>
                      <p className="text-xs text-muted-foreground mt-1">Select a provider tab above to configure its specific settings.</p>
                    </div>
                  </div>
                )}

                {/* Form — only shown when a provider tab is active */}
                {(!isMultiProvider || activeConfigProvider) && (
                  <>
                    {/* Environment Configuration Section */}
                    {(definition as any).environment_configuration && (
                      <EnvironmentConfigurationForm
                        definition={definition}
                        values={environmentVariables}
                        onChange={(v) => { setEnvironmentVariables(v); setShowConfigErrors(false) }}
                        errors={configErrors}
                        activeProvider={activeConfigProvider || undefined}
                      />
                    )}

                    {/* Fallback to original DynamicForm for backward compatibility */}
                    {!(definition as any).environment_configuration &&
                      !(definition as any).instance_configurations &&
                      definition.sections &&
                      definition.sections.length > 0 && (
                        <div>
                          <DynamicForm
                            definition={definition}
                            values={environmentVariables}
                            onChange={setEnvironmentVariables}
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

                    {!(definition as any).environment_configuration &&
                      !(definition as any).instance_configurations &&
                      (!definition.sections || definition.sections.length === 0) &&
                      (!definition.lifecycle_hooks || definition.lifecycle_hooks.length === 0) && (
                        <div className="text-sm text-muted-foreground">
                          This template has no additional configuration options.
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            {!definition && environmentTemplateId !== "none" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoadingSpinner />
                Loading configuration...
              </div>
            )}

            {environmentTemplateId === "none" && (
              <div className="text-sm text-muted-foreground">
                No template selected. Proceed to deployment configuration or select a template.
              </div>
            )}

            {showConfigErrors && Object.keys(configErrors).length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">Please fill in all required fields before continuing:</p>
                  <ul className="list-disc ml-4">
                    {Object.values(configErrors).map((msg, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400">{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {activeStep === "deployment" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Deployment credentials</h2>
              <p className="text-xs text-muted-foreground">Select credentials for each provider chosen in the configuration step.</p>
            </div>

            {isMultiProvider ? (
              <DeploymentFormFields
                mode="multi"
                requiredProviderSlugs={activeSlugs}
                form={multiDeploymentForm}
                onFormChange={setMultiDeploymentForm}
                providers={providers}
                credentialsBySlug={credentialsBySlug}
                isCompact={true}
              />
            ) : (
              <DeploymentFormFields
                form={deploymentForm}
                onFormChange={setDeploymentForm}
                providers={providers}
                credentials={credentials}
                isCompact={true}
              />
            )}
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
          {activeStep !== "deployment" && (
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
          {activeStep === "deployment" && (
            <Button
              size="sm"
              className="text-xs"
              onClick={handleFinish}
              disabled={isSubmitting || !canProceed("deployment")}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create environment"
              )}
            </Button>
          )}
        </div>
      </div>

      {isLoadingData && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <LoadingSpinner size="sm" />
          Loading templates and providers...
        </div>
      )}
    </div>
  )
}
