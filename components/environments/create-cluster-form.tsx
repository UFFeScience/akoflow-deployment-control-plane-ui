"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Provider, InstanceType, Template, ProviderCredential } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/clusters"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import { instanceTypesApi } from "@/lib/api/instance-types"
import { templatesApi } from "@/lib/api/templates"
import { instanceGroupTemplatesApi } from "@/lib/api/instance-group-templates"
import { ClusterFormFields, type ClusterFormData } from "./cluster-form-fields"
import { EnvironmentTemplateSelect } from "./environment-template-select"
import { toast } from "sonner"

export function CreateClusterForm() {
  const params = useParams()
  const router = useRouter()
  const { currentOrg } = useAuth()
  const environmentId = params.environmentId as string
  const projectId = params.projectId as string
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [providers, setProviders] = useState<Provider[]>([])
  const [credentials, setCredentials] = useState<ProviderCredential[]>([])
  const [instanceTypes, setInstanceTypes] = useState<InstanceType[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [instanceGroupTemplates, setInstanceGroupTemplates] = useState<Array<{ id: string; name: string; slug: string }>>([])
  
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [environmentTemplateVersionId, setEnvironmentTemplateVersionId] = useState<string | null>(null)
  
  const [form, setForm] = useState<ClusterFormData>({
    templateId: "none",
    providerId: "",
    credentialId: "",
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

    async function loadData() {
      setIsLoading(true)
      try {
        const [templateData, providerData, instanceTypeData, groupTemplateData] = await Promise.all([
          templatesApi.list().catch(() => []),
          (currentOrg ? providersApi.list(String(currentOrg.id)) : Promise.resolve([])).catch(() => []),
          instanceTypesApi.list().catch(() => []),
          instanceGroupTemplatesApi.list().catch(() => []),
        ])
        
        if (!active) return
        
        setTemplates(templateData)
        setProviders(providerData)
        setInstanceTypes(instanceTypeData)
        setInstanceGroupTemplates(groupTemplateData)

        // Set default provider and eagerly load its credentials
        const healthy = providerData.filter((p) => p.status !== "DOWN")
        const defaultProvider = healthy[0] || providerData[0]
        if (defaultProvider && currentOrg) {
          const defaultProviderId = String(defaultProvider.id)
          setForm((prev) => ({ ...prev, providerId: defaultProviderId }))
          providersApi
            .listCredentials(String(currentOrg.id), defaultProviderId)
            .then((credData) => { if (active) setCredentials(credData) })
            .catch(() => { if (active) setCredentials([]) })
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        toast.error("Failed to load form data")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload credentials when provider changes
  useEffect(() => {
    if (!form.providerId || !currentOrg) {
      setCredentials([])
      return
    }
    let active = true
    providersApi.listCredentials(String(currentOrg.id), form.providerId).then((data) => {
      if (active) setCredentials(data)
    }).catch((err) => {
      console.error("[credentials] failed to load:", err)
      if (active) setCredentials([])
    })
    return () => { active = false }
  }, [form.providerId, currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!form.providerId || !form.credentialId || !form.region) {
      toast.error("Provider, credentials, and region are required")
      return
    }

    const instancesPayload = [] as {
      instanceTypeId: string
      role?: string
      quantity: number
      metadata?: Record<string, unknown>
    }[]

    for (const g of form.instanceGroups.filter((g) => g.instanceTypeId && g.quantity > 0)) {
      let metadata: Record<string, unknown> | undefined

      if (g.metadata && g.metadata.trim().length > 0) {
        try {
          metadata = JSON.parse(g.metadata)
        } catch (err) {
          toast.error(`Invalid metadata JSON in group ${g.role || g.instanceTypeId}`)
          return
        }
      }

      instancesPayload.push({
        instanceTypeId: g.instanceTypeId,
        role: g.role || undefined,
        quantity: g.quantity,
        metadata,
      })
    }

    if (instancesPayload.length === 0) {
      toast.error("At least one instance group is required")
      return
    }

    const nodeCount = instancesPayload.reduce((sum, g) => sum + g.quantity, 0)
    setIsSaving(true)
    
    try {
      const payload: any = {
        templateId: form.templateId === "none" ? undefined : form.templateId,
        providerId: form.providerId,
        credentialId: form.credentialId,
        region: form.region,
        instanceGroups: instancesPayload,
        nodeCount,
      }

      // Include environment template version if loaded from template
      if (environmentTemplateVersionId) {
        payload.environment_template_version_id = environmentTemplateVersionId
      }
      
      await clustersApi.create(environmentId, payload)
      toast.success("Cluster created successfully")
      router.push(`/projects/${projectId}/environments/${environmentId}`)
    } catch (error) {
      toast.error("Failed to create cluster")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

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
          <CardTitle>Create New Cluster</CardTitle>
          <CardDescription>
            Select provider, template, and capacity to provision a new cluster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <EnvironmentTemplateSelect
            onTemplateSelected={(data) => {
              setTemplateLoaded(true)
              setEnvironmentTemplateVersionId(data.environmentTemplateVersionId)
              setForm((prev) => ({
                ...prev,
                instanceGroups: (data.instanceGroups || []).map((g) => ({
                  ...g,
                  instanceGroupTemplateId: g.instanceGroupTemplateId || "",
                })),
              }))
            }}
            instanceTypes={instanceTypes}
          />

          {templateLoaded && <Separator className="my-4" />}

          <ClusterFormFields
            form={form}
            onFormChange={setForm}
            providers={providers}
            credentials={credentials}
            instanceTypes={instanceTypes}
            templates={templates}
            instanceGroupTemplates={instanceGroupTemplates}
            isCompact={false}
          />

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleCreate}
              disabled={isSaving || !form.providerId || !form.credentialId || !form.region || form.instanceGroups.every((g) => !g.instanceTypeId)}
              className="min-w-[120px]"
            >
              {isSaving ? "Creating..." : "Create Cluster"}
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
