import { useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { environmentsApi } from "@/lib/api/environments"
import { templatesApi } from "@/lib/api/templates"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import { useTemplateDefinition } from "@/hooks/use-template-definition"
import { multiFormToPayload, type DeploymentFormData, type MultiProviderFormData } from "../deployment-form-fields"
import { steps, type StepId } from "./step-indicator"
import { toast } from "sonner"
import type { Provider, ProviderCredential, Template, TemplateVersion, ProviderConfiguration } from "@/lib/api/types"

export function useEnvironmentCreate() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentOrg } = useAuth()

  const [activeStep, setActiveStep]       = useState<StepId>("basics")
  const [templates, setTemplates]         = useState<Template[]>([])
  const [providers, setProviders]         = useState<Provider[]>([])
  const [credentials, setCredentials]     = useState<ProviderCredential[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [configErrors, setConfigErrors]   = useState<Record<string, string>>({})
  const [showConfigErrors, setShowConfigErrors] = useState(false)
  const [createdEnvironmentId, setCreatedEnvironmentId] = useState<string | null>(null)

  const [basics, setBasics] = useState({ name: "", description: "", executionMode: "manual" as "manual" | "auto" })
  const [environmentTemplateId, setEnvironmentTemplateId]     = useState<string>("none")
  const [templateVersions, setTemplateVersions]               = useState<TemplateVersion[]>([])
  const [selectedTemplateVersionId, setSelectedTemplateVersionId] = useState<string | null>(null)
  const [isLoadingVersions, setIsLoadingVersions]             = useState(false)
  const [environmentVariables, setEnvironmentVariables]       = useState<Record<string, unknown>>({})
  const [lifecycleHooks, setLifecycleHooks]                   = useState<Record<string, string>>({})
  const [ansiblePlaybooks, setAnsiblePlaybooks]               = useState<ProviderConfiguration[]>([])
  const [deploymentForm, setDeploymentForm]                   = useState<DeploymentFormData>({ providerId: "", credentialId: "" })
  const [multiDeploymentForm, setMultiDeploymentForm]         = useState<MultiProviderFormData>({ providerCredentials: {} })
  const [credentialsBySlug, setCredentialsBySlug]             = useState<Record<string, ProviderCredential[]>>({})
  const [activeConfigProvider, setActiveConfigProvider]       = useState<string>("")
  const [selectedOptionalSlugs, setSelectedOptionalSlugs]     = useState<string[]>([])
  const [autoSetupNotice, setAutoSetupNotice]                 = useState<string | null>(null)
  const hasAppliedQuerySetup                                  = useRef(false)

  useEffect(() => {
    if (environmentTemplateId === "none") { setTemplateVersions([]); setSelectedTemplateVersionId(null); setAnsiblePlaybooks([]); return }
    let active = true; setIsLoadingVersions(true)
    templatesApi.listVersions(environmentTemplateId)
      .then((vers) => { if (!active) return; setTemplateVersions(vers); const v = vers.find((v) => v.is_active) ?? vers[0]; setSelectedTemplateVersionId(v?.id ? String(v.id) : null) })
      .catch(() => {}).finally(() => { if (active) setIsLoadingVersions(false) })
    return () => { active = false }
  }, [environmentTemplateId])

  useEffect(() => {
    if (environmentTemplateId === "none" || !selectedTemplateVersionId) { setAnsiblePlaybooks([]); return }
    let active = true
    templatesApi.listProviderConfigurations(environmentTemplateId, selectedTemplateVersionId)
      .then((cfgs) => { if (active) setAnsiblePlaybooks((cfgs ?? []).filter((c) => !!c.ansible_playbook)) })
      .catch(() => { if (active) setAnsiblePlaybooks([]) })
    return () => { active = false }
  }, [environmentTemplateId, selectedTemplateVersionId])

  const { definition, activeVersionId, isLoading: isLoadingDefinition } = useTemplateDefinition(
    environmentTemplateId === "none" ? null : environmentTemplateId, selectedTemplateVersionId,
  )

  const availableSlugs = definition?.providers ?? []
  const mandatorySlugs = definition?.required_providers ?? []
  const minProviders   = definition?.min_providers ?? (availableSlugs.length > 0 ? 1 : 0)
  const isMultiProvider = availableSlugs.length > 0
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
        setTemplates(templateData); setProviders(providerData)

        if (!hasAppliedQuerySetup.current) {
          const preTemplateSlug = searchParams.get("templateSlug")
          const preName         = searchParams.get("name")
          const preProviderId   = searchParams.get("providerId")
          const preCredentialId = searchParams.get("credentialId")
          const hasQuerySetup   = Boolean(preTemplateSlug || preName || preProviderId || preCredentialId)

          const matchedTemplate = preTemplateSlug
            ? templateData.find((t: Template) => t.slug === preTemplateSlug)
            : undefined

          if (preName) {
            setBasics((prev) => ({ ...prev, name: prev.name || preName }))
          }
          if (matchedTemplate) {
            setEnvironmentTemplateId(String(matchedTemplate.id))
          }
          if (preProviderId) {
            setDeploymentForm((prev) => ({
              ...prev,
              providerId:   preProviderId,
              credentialId: preCredentialId ?? prev.credentialId,
            }))
            if (currentOrg) {
              providersApi.listCredentials(String(currentOrg.id), preProviderId)
                .then((c) => { if (active) setCredentials(c) })
                .catch(() => { if (active) setCredentials([]) })
            }
          } else {
            const firstHealthy = providerData.find((p: any) => p.status !== "DOWN")
            const def = firstHealthy || providerData[0]
            if (def && currentOrg) {
              const id = String(def.id)
              setDeploymentForm((prev) => ({ ...prev, providerId: prev.providerId || id }))
              providersApi.listCredentials(String(currentOrg.id), id).then((c) => { if (active) setCredentials(c) }).catch(() => { if (active) setCredentials([]) })
            }
          }

          if (preName && matchedTemplate) {
            setActiveStep("config")
          } else if (preName) {
            setActiveStep("template")
          }

          if (hasQuerySetup) {
            setAutoSetupNotice("This setup was pre-filled from the link. Basics were completed and template selection was advanced for you.")
          }
          hasAppliedQuerySetup.current = true
        }
      } catch { if (active) { setTemplates([]); setProviders([]) } } finally { if (active) setIsLoadingData(false) }
    }
    load(); return () => { active = false }
  }, [currentOrg]) // eslint-disable-line

  useEffect(() => {
    if (!deploymentForm.providerId || !currentOrg) { setCredentials([]); return }
    let active = true
    const preCredentialId = searchParams.get("credentialId")
    providersApi.listCredentials(String(currentOrg.id), deploymentForm.providerId)
      .then((d) => {
        if (!active) return
        setCredentials(d)
        if (preCredentialId) {
          setDeploymentForm((prev) => ({ ...prev, credentialId: prev.credentialId || preCredentialId }))
        }
      }).catch(() => { if (active) setCredentials([]) })
    return () => { active = false }
  }, [deploymentForm.providerId, currentOrg]) // eslint-disable-line

  useEffect(() => {
    if (definition?.providers?.length) {
      const slugs = definition.providers; const mandatory = definition.required_providers ?? []
      setSelectedOptionalSlugs(slugs.length === 1 && !mandatory.includes(slugs[0]) ? [slugs[0]] : [])
      setActiveConfigProvider((prev) => (prev && slugs.includes(prev) ? prev : ""))
    } else { setActiveConfigProvider(""); setSelectedOptionalSlugs([]) }
  }, [definition])

  useEffect(() => {
    if (activeSlugs.length === 1) setActiveConfigProvider(activeSlugs[0])
    else if (activeSlugs.length > 1 && activeConfigProvider && !activeSlugs.includes(activeConfigProvider)) setActiveConfigProvider("")
    else if (activeSlugs.length === 0) setActiveConfigProvider("")
  }, [activeSlugs]) // eslint-disable-line

  useEffect(() => {
    if (!isMultiProvider || !currentOrg || !providers.length) { setCredentialsBySlug({}); return }
    let active = true
    Promise.all(availableSlugs.map(async (slug) => {
      const match = providers.find((p) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase())
      if (!match) return [slug, [] as ProviderCredential[]] as const
      const creds = await providersApi.listCredentials(String(currentOrg.id), String(match.id)).catch(() => [])
      return [slug, creds] as const
    })).then((results) => {
      if (!active) return
      setCredentialsBySlug(Object.fromEntries(results))
      setMultiDeploymentForm((prev) => {
        const updated = { ...prev.providerCredentials }
        for (const slug of availableSlugs) {
          if (!updated[slug]?.providerId) {
            const match = providers.find((p) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase())
            if (match) updated[slug] = { providerId: String(match.id), credentialId: "" }
          }
        }
        return { providerCredentials: updated }
      })
    })
    return () => { active = false }
  }, [isMultiProvider, definition, providers, currentOrg]) // eslint-disable-line

  function validateConfigFields(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!definition) return errors
    const expConfig = (definition as any).environment_configuration
    if (expConfig?.sections) {
      for (const section of expConfig.sections) {
        for (const field of section.fields || []) {
          if (field.required) {
            const val = environmentVariables[field.name] ?? field.default
            if (val === undefined || val === null || val === "") errors[field.name] = `${field.label} is required`
          }
        }
      }
    }
    return errors
  }

  function nextStep() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    const next = steps[idx + 1]; if (!next) return
    if (activeStep === "config") {
      const errors = validateConfigFields()
      if (Object.keys(errors).length > 0) { setConfigErrors(errors); setShowConfigErrors(true); return }
      setConfigErrors({}); setShowConfigErrors(false)
    }
    setActiveStep(next.id)
  }

  function prevStep() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    const prev = steps[idx - 1]; if (prev) setActiveStep(prev.id)
  }

  function canProceed(): boolean {
    if (activeStep === "basics") return basics.name.trim().length > 0
    if (activeStep === "template") return true
    if (activeStep === "config") return !(isMultiProvider && activeSlugs.length < minProviders)
    if (activeStep === "deployment") {
      if (isMultiProvider) return activeSlugs.every((s) => Boolean(multiDeploymentForm.providerCredentials[s]?.providerId) && Boolean(multiDeploymentForm.providerCredentials[s]?.credentialId))
      return Boolean(deploymentForm.providerId && deploymentForm.credentialId)
    }
    return true
  }

  async function handleFinish() {
    if (activeStep === "runbooks") {
      router.push(`/projects/${projectId}/environments/${createdEnvironmentId}`)
      return
    }
    if (isSubmitting) return; setIsSubmitting(true)
    try {
      const configurationJson: Record<string, unknown> = {}
      if (Object.keys(environmentVariables).length > 0) configurationJson.environment_configuration = environmentVariables
      if (Object.keys(lifecycleHooks).length > 0) configurationJson.lifecycle_hooks = lifecycleHooks
      const providerCredentials = isMultiProvider
        ? multiFormToPayload(multiDeploymentForm).filter((e) => activeSlugs.some((s) => { const match = providers.find((p) => p.slug === s || p.type?.toLowerCase() === s.toLowerCase()); return match && String(match.id) === e.provider_id }))
        : deploymentForm.providerId ? [{ provider_id: deploymentForm.providerId, credential_id: deploymentForm.credentialId || null }] : []
      const payload = {
        name: basics.name.trim(), description: basics.description.trim() || undefined,
        execution_mode: basics.executionMode,
        environment_template_version_id: selectedTemplateVersionId ?? activeVersionId ?? undefined,
        ...(Object.keys(configurationJson).length > 0 && { configuration_json: configurationJson }),
        ...(providerCredentials.length && { deployment: { provider_credentials: providerCredentials } }),
      }
      const result = await environmentsApi.provision(projectId, payload)
      toast.success("Environment created")
      setCreatedEnvironmentId(result.id)
      setActiveStep("provisioning")
      setIsSubmitting(false)
    } catch { toast.error("Failed to create environment"); setIsSubmitting(false) }
  }

  return {
    projectId, activeStep, setActiveStep,
    basics, setBasics, environmentTemplateId, setEnvironmentTemplateId,
    templateVersions, selectedTemplateVersionId, setSelectedTemplateVersionId,
    isLoadingVersions, definition, isLoadingDefinition,
    environmentVariables, setEnvironmentVariables, lifecycleHooks, setLifecycleHooks,
    ansiblePlaybooks, availableSlugs, mandatorySlugs, minProviders, isMultiProvider,
    activeSlugs, selectedOptionalSlugs, setSelectedOptionalSlugs,
    activeConfigProvider, setActiveConfigProvider,
    deploymentForm, setDeploymentForm, multiDeploymentForm, setMultiDeploymentForm,
    providers, credentials, credentialsBySlug,
    configErrors, showConfigErrors, setShowConfigErrors,
    isLoadingData, isSubmitting,
    nextStep, prevStep, canProceed, handleFinish,
    templates, createdEnvironmentId,
    autoSetupNotice,
  }
}
