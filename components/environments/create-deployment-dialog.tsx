"use client"

import { useEffect, useRef, useState } from "react"
import { FormDialog } from "@/components/form/form-dialog"
import { DialogActions } from "@/components/form/dialog-actions"
import { LoadingState } from "@/components/ui/loading-state"
import { deploymentsApi } from "@/lib/api/deployments"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import {
  DeploymentFormFields,
  type DeploymentFormData,
  type MultiProviderFormData,
  multiFormToPayload,
} from "./deployment-form-fields"
import type { Deployment, Environment, Provider, ProviderCredential } from "@/lib/api/types"
import { toast } from "sonner"

interface CreateDeploymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  environmentId: string
  environment: Environment | null
  existingDeployments?: Deployment[]
  onSuccess?: () => Promise<void>
}

export function CreateDeploymentDialog({
  open,
  onOpenChange,
  environmentId,
  environment,
  existingDeployments = [],
  onSuccess,
}: CreateDeploymentDialogProps) {
  const { currentOrg } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])

  // ── Single-provider state ─────────────────────────────────────────────────
  const [credentials, setCredentials] = useState<ProviderCredential[]>([])
  const [form, setForm] = useState<DeploymentFormData>({ providerId: "", credentialId: "" })

  // ── Multi-provider state ──────────────────────────────────────────────────
  const [requiredProviderSlugs, setRequiredProviderSlugs] = useState<string[]>([])
  const [credentialsBySlug, setCredentialsBySlug] = useState<Record<string, ProviderCredential[]>>({})
  const [multiForm, setMultiForm] = useState<MultiProviderFormData>({ providerCredentials: {} })

  const isMultiMode = requiredProviderSlugs.length > 0

  const environmentSnapshot = useRef<Environment | null>(null)
  const prevOpen = useRef(false)

  useEffect(() => {
    const justOpened = open && !prevOpen.current
    prevOpen.current = open
    if (!justOpened) return

    environmentSnapshot.current = environment
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const providerData = await (currentOrg
          ? providersApi.list(String(currentOrg.id))
          : Promise.resolve([])
        ).catch(() => [])

        if (!active) return
        setProviders(providerData)

        // Derive provider slugs from existing deployments' provider_credentials
        const seen = new Set<string>()
        const slugs: string[] = []
        for (const d of existingDeployments) {
          for (const cred of d.provider_credentials ?? []) {
            const slug = cred.provider_slug
              ?? providerData.find((p: Provider) => String(p.id) === String(cred.provider_id))?.slug
              ?? providerData.find((p: Provider) => String(p.id) === String(cred.provider_id))?.type?.toLowerCase()
            if (slug && !seen.has(slug)) {
              seen.add(slug)
              slugs.push(slug)
            }
          }
        }

        if (!active) return

        if (slugs.length > 0) {
          setRequiredProviderSlugs(slugs)

          const initialEntries: Record<string, { providerId: string; credentialId: string }> = {}
          for (const slug of slugs) {
            const match = providerData.find(
              (p: Provider) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase()
            )
            initialEntries[slug] = { providerId: match ? String(match.id) : "", credentialId: "" }
          }
          setMultiForm({ providerCredentials: initialEntries })

          for (const slug of slugs) {
            const match = providerData.find(
              (p: Provider) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase()
            )
            if (match && currentOrg) {
              providersApi
                .listCredentials(String(currentOrg.id), String(match.id))
                .then((creds) => { if (active) setCredentialsBySlug((prev) => ({ ...prev, [slug]: creds })) })
                .catch(() => { if (active) setCredentialsBySlug((prev) => ({ ...prev, [slug]: [] })) })
            }
          }
        } else {
          // No existing deployments — single-provider fallback
          setRequiredProviderSlugs([])
          const firstHealthy = providerData.find((p: Provider) => p.status !== "DOWN")
          const defaultProvider = firstHealthy || providerData[0]
          const initialForm: DeploymentFormData = {
            providerId: defaultProvider ? String(defaultProvider.id) : "",
            credentialId: "",
          }
          setForm(initialForm)
          if (initialForm.providerId && currentOrg) {
            providersApi
              .listCredentials(String(currentOrg.id), initialForm.providerId)
              .then((creds) => { if (active) setCredentials(creds) })
              .catch(() => { if (active) setCredentials([]) })
          }
        }
      } catch {
        toast.error("Failed to load form data")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload single-mode credentials when provider changes
  useEffect(() => {
    if (isMultiMode || !form.providerId || !currentOrg) {
      if (!isMultiMode) setCredentials([])
      return
    }
    let active = true
    providersApi
      .listCredentials(String(currentOrg.id), form.providerId)
      .then((data) => { if (active) setCredentials(data) })
      .catch(() => { if (active) setCredentials([]) })
    return () => { active = false }
  }, [form.providerId, currentOrg, isMultiMode]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (isMultiMode) {
      const missing = requiredProviderSlugs.filter(
        (slug) => !multiForm.providerCredentials[slug]?.credentialId
      )
      if (missing.length > 0) {
        toast.error(`Please select credentials for: ${missing.join(", ")}`)
        return
      }
      setIsSubmitting(true)
      try {
        await deploymentsApi.create(environmentId, { providerCredentials: multiFormToPayload(multiForm) })
        toast.success("Deployment created successfully")
        onOpenChange(false)
        await onSuccess?.()
      } catch {
        toast.error("Failed to create deployment")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      if (!form.providerId || !form.credentialId) {
        toast.error("Provider and credentials are required")
        return
      }
      setIsSubmitting(true)
      try {
        await deploymentsApi.create(environmentId, {
          providerId: form.providerId,
          credentialId: form.credentialId,
        })
        toast.success("Deployment created successfully")
        onOpenChange(false)
        await onSuccess?.()
      } catch {
        toast.error("Failed to create deployment")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const canSubmit = isMultiMode
    ? requiredProviderSlugs.every(
        (slug) =>
          !!multiForm.providerCredentials[slug]?.providerId &&
          !!multiForm.providerCredentials[slug]?.credentialId
      )
    : !!form.providerId && !!form.credentialId

  const description = environment?.name
    ? `Provision a new deployment for "${environment.name}".`
    : "Provision a new deployment for this environment."

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Deployment"
      description={description}
      contentClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      footer={
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={handleCreate}
          submitLabel="Create Deployment"
          isSubmitting={isSubmitting}
          isDisabled={isLoading || !canSubmit}
        />
      }
    >
      {isLoading ? (
        <LoadingState label="Loading form data..." />
      ) : isMultiMode ? (
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
          form={form}
          onFormChange={setForm}
          providers={providers}
          credentials={credentials}
          isCompact={false}
        />
      )}
    </FormDialog>
  )
}
