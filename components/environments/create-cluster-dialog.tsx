"use client"

import { useEffect, useRef, useState } from "react"
import { FormDialog } from "@/components/form/form-dialog"
import { DialogActions } from "@/components/form/dialog-actions"
import { LoadingState } from "@/components/ui/loading-state"
import { clustersApi } from "@/lib/api/clusters"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import { ClusterFormFields, type ClusterFormData } from "./cluster-form-fields"
import type { Environment, Provider, ProviderCredential } from "@/lib/api/types"
import { toast } from "sonner"

interface CreateClusterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  environmentId: string
  environment: Environment | null
  onSuccess?: () => Promise<void>
}

function buildInitialForm(
  environment: Environment | null,
  providers: Provider[],
): ClusterFormData {
  const gcpProvider = providers.find(
    (p) => p.name?.toUpperCase().includes("GCP") || p.name?.toUpperCase().includes("GOOGLE")
  )
  const firstHealthy = providers.find((p) => p.status !== "DOWN")
  const defaultProvider = gcpProvider || firstHealthy || providers[0]

  return {
    providerId: defaultProvider ? String(defaultProvider.id) : "",
    credentialId: "",
  }
}

export function CreateClusterDialog({
  open,
  onOpenChange,
  environmentId,
  environment,
  onSuccess,
}: CreateClusterDialogProps) {
  const { currentOrg } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [credentials, setCredentials] = useState<ProviderCredential[]>([])
  // Snapshot of environment captured the moment the dialog opens — prevents
  // the 5-second auto-refresh from re-triggering the load and resetting the form.
  const environmentSnapshot = useRef<Environment | null>(null)
  const [form, setForm] = useState<ClusterFormData>({
    providerId: "",
    credentialId: "",
  })

  // Load data only once when the dialog transitions to open.
  // We deliberately exclude `environment` from deps — the parent refreshes it every 5s
  // and we don't want that to reset the form while the user is filling it in.
  const prevOpen = useRef(false)
  useEffect(() => {
    const justOpened = open && !prevOpen.current
    prevOpen.current = open

    if (!justOpened) return

    // Snapshot the environment at open-time
    environmentSnapshot.current = environment

    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const providerData = await (currentOrg ? providersApi.list(String(currentOrg.id)) : Promise.resolve([])).catch(() => [])
        if (!active) return

        setProviders(providerData)

        const initialForm = buildInitialForm(environmentSnapshot.current, providerData)
        setForm(initialForm)

        // Eagerly load credentials for the default provider so they are ready
        // when the form renders — the reactive effect may not fire if providerId
        // never transitions from its initial "" value.
        if (initialForm.providerId && currentOrg) {
          providersApi
            .listCredentials(String(currentOrg.id), initialForm.providerId)
            .then((credData) => { if (active) setCredentials(credData) })
            .catch(() => { if (active) setCredentials([]) })
        }
      } catch {
        toast.error("Failed to load form data")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch credentials whenever the selected provider changes
  useEffect(() => {
    if (!form.providerId || !currentOrg) {
      setCredentials([])
      return
    }
    let active = true
    providersApi.listCredentials(String(currentOrg.id), form.providerId).then((data) => {
      console.log("Loaded credentials for provider", form.providerId, data)
      if (active) setCredentials(data)
    }).catch((err) => {
      console.error("[credentials] failed to load:", err)
      if (active) setCredentials([])
    })
    return () => { active = false }
  }, [form.providerId, currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!form.providerId || !form.credentialId) {
      toast.error("Provider and credentials are required")
      return
    }

    setIsSubmitting(true)
    try {
      await clustersApi.create(environmentId, {
        providerId: form.providerId,
        credentialId: form.credentialId,
      })
      toast.success("Cluster created successfully")
      onOpenChange(false)
      await onSuccess?.()
    } catch {
      toast.error("Failed to create cluster")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit =
    Boolean(form.providerId) &&
    Boolean(form.credentialId)

  const description = environment?.name
    ? `Provision a new cluster for this environment. Environment: ${environment.name}`
    : "Provision a new cluster for this environment."

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Cluster"
      description={description}
      contentClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      footer={
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={handleCreate}
          submitLabel="Create Cluster"
          isSubmitting={isSubmitting}
          isDisabled={isLoading || !canSubmit}
        />
      }
    >
      {isLoading ? (
        <LoadingState label="Loading form data..." />
      ) : (
        <ClusterFormFields
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
