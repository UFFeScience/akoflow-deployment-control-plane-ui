"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { FormDialog } from "@/components/form/form-dialog"
import { DialogActions } from "@/components/form/dialog-actions"
import { LoadingState } from "@/components/ui/loading-state"
import { clustersApi } from "@/lib/api/clusters"
import { providersApi } from "@/lib/api/providers"
import { instanceTypesApi } from "@/lib/api/instance-types"
import { instanceGroupTemplatesApi } from "@/lib/api/instance-group-templates"
import { ClusterFormFields, type ClusterFormData } from "./cluster-form-fields"
import type { Experiment, Provider, InstanceType } from "@/lib/api/types"
import { toast } from "sonner"

interface CreateClusterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experimentId: string
  experiment: Experiment | null
  onSuccess?: () => Promise<void>
}

function buildInitialForm(
  experiment: Experiment | null,
  providers: Provider[],
  instanceTypes: InstanceType[],
  instanceGroupTemplates: Array<{ id: string; name: string; slug: string }>,
  pickDefaultTemplateId: string
): ClusterFormData {
  // Try to extract region and provider from the experiment's configuration_json
  const configJson = (experiment as any)?.configuration_json as Record<string, unknown> | undefined
  const expConfig = configJson?.experiment_configuration as Record<string, unknown> | undefined

  // Look for common region keys
  const regionFromConfig =
    (expConfig?.gcp_region as string) ||
    (expConfig?.region as string) ||
    (expConfig?.aws_region as string) ||
    ""

  // Pick provider: prefer GCP if experiment references GCP keys, else first healthy
  const gcpProvider = providers.find(
    (p) => p.name?.toUpperCase().includes("GCP") || p.name?.toUpperCase().includes("GOOGLE")
  )
  const firstHealthy = providers.find((p) => p.status !== "DOWN")
  const defaultProvider = gcpProvider || firstHealthy

  // Build default instance group
  const defaultGroup: ClusterFormData["instanceGroups"][0] = {
    id: crypto.randomUUID(),
    instanceTypeId: "",
    instanceGroupTemplateId: pickDefaultTemplateId,
    role: "",
    quantity: 1,
    metadata: "",
    terraformVariables: {},
    lifecycleHooks: {},
  }

  return {
    providerId: defaultProvider?.id || "",
    region: regionFromConfig,
    instanceGroups: [defaultGroup],
  }
}

export function CreateClusterDialog({
  open,
  onOpenChange,
  experimentId,
  experiment,
  onSuccess,
}: CreateClusterDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [instanceTypes, setInstanceTypes] = useState<InstanceType[]>([])
  const [instanceGroupTemplates, setInstanceGroupTemplates] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([])
  // Snapshot of experiment captured the moment the dialog opens — prevents
  // the 5-second auto-refresh from re-triggering the load and resetting the form.
  const experimentSnapshot = useRef<Experiment | null>(null)
  const [form, setForm] = useState<ClusterFormData>({
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

  const pickDefaultTemplateId = useMemo(() => {
    const map: Record<string, string> = {}
    instanceGroupTemplates.forEach((t) => (map[t.slug] = t.id))
    return map["akoflow-compute"] || map["gke-compute"] || instanceGroupTemplates[0]?.id || ""
  }, [instanceGroupTemplates])

  // Load data only once when the dialog transitions to open.
  // We deliberately exclude `experiment` from deps — the parent refreshes it every 5s
  // and we don't want that to reset the form while the user is filling it in.
  const prevOpen = useRef(false)
  useEffect(() => {
    const justOpened = open && !prevOpen.current
    prevOpen.current = open

    if (!justOpened) return

    // Snapshot the experiment at open-time
    experimentSnapshot.current = experiment

    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const [providerData, instanceTypeData, groupTemplateData] = await Promise.all([
          providersApi.list().catch(() => []),
          instanceTypesApi.list().catch(() => []),
          instanceGroupTemplatesApi.list().catch(() => []),
        ])
        if (!active) return

        const normalizedInstanceTypes = instanceTypeData.map((it: any) => ({
          ...it,
          providerId:
            it.providerId || it.provider_id || it.provider?.id || it.providerId,
        }))

        setProviders(providerData)
        setInstanceTypes(normalizedInstanceTypes)
        setInstanceGroupTemplates(groupTemplateData.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })))

        const defaultTemplate =
          groupTemplateData.find((t: any) => t.slug === "akoflow-compute")?.id ||
          groupTemplateData.find((t: any) => t.slug === "gke-compute")?.id ||
          groupTemplateData[0]?.id ||
          ""

        setForm(
          buildInitialForm(experimentSnapshot.current, providerData, normalizedInstanceTypes, groupTemplateData, defaultTemplate)
        )
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

  async function handleCreate() {
    if (!form.providerId || !form.region) {
      toast.error("Provider and region are required")
      return
    }

    const instanceGroupsPayload: {
      instanceTypeId: string
      instanceGroupTemplateId?: string
      role?: string
      quantity: number
      metadata?: Record<string, unknown>
      terraformVariables?: Record<string, unknown>
      lifecycleHooks?: Record<string, string>
    }[] = []

    for (const group of form.instanceGroups.filter((g) => g.instanceTypeId && g.quantity > 0)) {
      let metadata: Record<string, unknown> | undefined
      if (group.metadata.trim()) {
        try {
          metadata = JSON.parse(group.metadata)
        } catch {
          toast.error(`Invalid metadata JSON in group ${group.role || group.instanceTypeId}`)
          return
        }
      }
      instanceGroupsPayload.push({
        instanceTypeId: group.instanceTypeId,
        instanceGroupTemplateId: group.instanceGroupTemplateId || undefined,
        role: group.role || undefined,
        quantity: group.quantity,
        metadata,
        ...(group.terraformVariables && Object.keys(group.terraformVariables).length > 0
          ? { terraformVariables: group.terraformVariables }
          : {}),
        ...(group.lifecycleHooks && Object.keys(group.lifecycleHooks).length > 0
          ? { lifecycleHooks: group.lifecycleHooks }
          : {}),
      })
    }

    if (instanceGroupsPayload.length === 0) {
      toast.error("At least one instance group with a type is required")
      return
    }

    const nodeCount = instanceGroupsPayload.reduce((sum, g) => sum + g.quantity, 0)
    setIsSubmitting(true)
    try {
      await clustersApi.create(experimentId, {
        providerId: form.providerId,
        region: form.region,
        instanceGroups: instanceGroupsPayload,
        nodeCount,
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
    Boolean(form.region) &&
    form.instanceGroups.some((g) => g.instanceTypeId && g.quantity > 0)

  const description = experiment?.name
    ? `Provision a new cluster for this experiment. Experiment: ${experiment.name}`
    : "Provision a new cluster for this experiment."

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
          instanceTypes={instanceTypes}
          instanceGroupTemplates={instanceGroupTemplates}
          isCompact={false}
        />
      )}
    </FormDialog>
  )
}
