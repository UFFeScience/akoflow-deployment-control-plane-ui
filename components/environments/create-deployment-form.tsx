"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Provider, ProviderCredential, TemplateVersion } from "@/lib/api/types"
import { deploymentsApi } from "@/lib/api/deployments"
import { providersApi } from "@/lib/api/providers"
import { templatesApi } from "@/lib/api/templates"
import { environmentsApi } from "@/lib/api/environments"
import { useAuth } from "@/contexts/auth-context"
import {
  DeploymentFormFields,
  type DeploymentFormData,
  type MultiProviderFormData,
  multiFormToPayload,
} from "./deployment-form-fields"
import { toast } from "sonner"

export function CreateDeploymentForm() {
  const params = useParams()
  const router = useRouter()
  const { currentOrg } = useAuth()
  const environmentId = params.environmentId as string
  const projectId = params.projectId as string
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [providers, setProviders] = useState<Provider[]>([])

  // ── Single-provider (legacy) state ─────────────────────────────────────────
  const [credentials, setCredentials] = useState<ProviderCredential[]>([])
  const [singleForm, setSingleForm] = useState<DeploymentFormData>({ providerId: "", credentialId: "" })

  // ── Multi-provider state ───────────────────────────────────────────────────
  const [requiredProviderSlugs, setRequiredProviderSlugs] = useState<string[]>([])
  const [credentialsBySlug, setCredentialsBySlug] = useState<Record<string, ProviderCredential[]>>({})
  const [multiForm, setMultiForm] = useState<MultiProviderFormData>({ providerCredentials: {} })

  const isMultiMode = requiredProviderSlugs.length > 0

  // ── Load providers + template providers definition ─────────────────────────
  useEffect(() => {
    let active = true

    async function loadData() {
      setIsLoading(true)
      try {
        const providerData = await (currentOrg
          ? providersApi.list(String(currentOrg.id))
          : Promise.resolve([])
        ).catch(() => [])

        if (!active) return
        setProviders(providerData)

        // Try to get required providers from the environment's active template
        let templateProviders: string[] = []
        try {
          // Step 1: Load the environment to get its template version ID
          const env = await environmentsApi.get(projectId, environmentId).catch(() => null)
          const versionId = env?.environment_template_version_id ?? env?.environmentTemplateVersionId
          if (versionId) {
            // Step 2: Load the template version by ID to get definition_json.providers
            const templateVersion: TemplateVersion | null = await templatesApi
              .getVersionById(String(versionId))
              .catch(() => null)
            if (templateVersion?.definition_json?.providers?.length) {
              templateProviders = templateVersion.definition_json.providers
            }
          }
        } catch {
          // template definition unavailable — fall back to single-provider mode
        }

        if (!active) return

        if (templateProviders.length > 0) {
          setRequiredProviderSlugs(templateProviders)

          const initialEntries: Record<string, { providerId: string; credentialId: string }> = {}
          for (const slug of templateProviders) {
            const match = providerData.find(
              (p: Provider) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase()
            )
            initialEntries[slug] = { providerId: match ? String(match.id) : "", credentialId: "" }
          }
          setMultiForm({ providerCredentials: initialEntries })

          for (const slug of templateProviders) {
            const match = providerData.find(
              (p: Provider) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase()
            )
            if (match && currentOrg) {
              providersApi
                .listCredentials(String(currentOrg.id), String(match.id))
                .then((credData: ProviderCredential[]) => {
                  if (active) setCredentialsBySlug((prev) => ({ ...prev, [slug]: credData }))
                })
                .catch(() => {
                  if (active) setCredentialsBySlug((prev) => ({ ...prev, [slug]: [] }))
                })
            }
          }
        } else {
          const healthy = providerData.filter((p: Provider) => p.status !== "DOWN")
          const defaultProvider = healthy[0] || providerData[0]
          if (defaultProvider && currentOrg) {
            const defaultProviderId = String(defaultProvider.id)
            setSingleForm((prev) => ({ ...prev, providerId: defaultProviderId }))
            providersApi
              .listCredentials(String(currentOrg.id), defaultProviderId)
              .then((credData: ProviderCredential[]) => { if (active) setCredentials(credData) })
              .catch(() => { if (active) setCredentials([]) })
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        toast.error("Failed to load form data")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadData()
    return () => { active = false }
  }, [currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload single-mode credentials when provider changes
  useEffect(() => {
    if (isMultiMode || !singleForm.providerId || !currentOrg) {
      if (!isMultiMode) setCredentials([])
      return
    }
    let active = true
    providersApi.listCredentials(String(currentOrg.id), singleForm.providerId).then((data) => {
      if (active) setCredentials(data)
    }).catch(() => { if (active) setCredentials([]) })
    return () => { active = false }
  }, [singleForm.providerId, currentOrg, isMultiMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload multi-mode credentials when a provider selection changes
  useEffect(() => {
    if (!isMultiMode || !currentOrg) return
    let active = true
    for (const slug of requiredProviderSlugs) {
      const entry = multiForm.providerCredentials[slug]
      if (!entry?.providerId) continue
      providersApi.listCredentials(String(currentOrg.id), entry.providerId).then((data) => {
        if (active) setCredentialsBySlug((prev) => ({ ...prev, [slug]: data }))
      }).catch(() => { if (active) setCredentialsBySlug((prev) => ({ ...prev, [slug]: [] })) })
    }
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(Object.fromEntries(requiredProviderSlugs.map((s) => [s, multiForm.providerCredentials[s]?.providerId])))])

  async function handleCreate() {
    if (isMultiMode) {
      const missing = requiredProviderSlugs.filter(
        (slug) => !multiForm.providerCredentials[slug]?.providerId
      )
      if (missing.length > 0) {
        toast.error(`Please select a provider for: ${missing.join(", ")}`)
        return
      }
      setIsSaving(true)
      try {
        await deploymentsApi.create(environmentId, { providerCredentials: multiFormToPayload(multiForm) })
        toast.success("Deployment created successfully")
        router.push(`/projects/${projectId}/environments/${environmentId}`)
      } catch (error) {
        toast.error("Failed to create deployment")
        console.error(error)
      } finally {
        setIsSaving(false)
      }
    } else {
      if (!singleForm.providerId || !singleForm.credentialId) {
        toast.error("Provider and credentials are required")
        return
      }
      setIsSaving(true)
      try {
        await deploymentsApi.create(environmentId, {
          providerId: singleForm.providerId,
          credentialId: singleForm.credentialId,
        })
        toast.success("Deployment created successfully")
        router.push(`/projects/${projectId}/environments/${environmentId}`)
      } catch (error) {
        toast.error("Failed to create deployment")
        console.error(error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const canSubmit = isMultiMode
    ? requiredProviderSlugs.every((slug) => !!multiForm.providerCredentials[slug]?.providerId)
    : !!singleForm.providerId && !!singleForm.credentialId

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/environments/${environmentId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Environment
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading form data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/projects/${projectId}/environments/${environmentId}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Environment
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Deployment</CardTitle>
          <CardDescription>
            {isMultiMode
              ? `This template requires credentials for: ${requiredProviderSlugs.map((s) => s.toUpperCase()).join(", ")}.`
              : "Select provider and credentials. Region and instance configuration are defined in the Terraform template."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isMultiMode ? (
            <DeploymentFormFields
              mode="multi"
              requiredProviderSlugs={requiredProviderSlugs}
              form={multiForm}
              onFormChange={setMultiForm}
              providers={providers}
              credentialsBySlug={credentialsBySlug}
              isCompact={false}
            />
          ) : (
            <DeploymentFormFields
              form={singleForm}
              onFormChange={setSingleForm}
              providers={providers}
              credentials={credentials}
              isCompact={false}
            />
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleCreate}
              disabled={isSaving || !canSubmit}
              className="min-w-[120px]"
            >
              {isSaving ? "Creating..." : "Create Deployment"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/environments/${environmentId}`)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
