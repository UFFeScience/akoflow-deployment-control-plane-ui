"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Provider, InstanceType, Template } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/clusters"
import { providersApi } from "@/lib/api/providers"
import { instanceTypesApi } from "@/lib/api/instance-types"
import { templatesApi } from "@/lib/api/templates"
import { ClusterFormFields, type ClusterFormData } from "./cluster-form-fields"
import { toast } from "sonner"

export function CreateClusterForm() {
  const params = useParams()
  const router = useRouter()
  const experimentId = params.experimentId as string
  const projectId = params.projectId as string
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [providers, setProviders] = useState<Provider[]>([])
  const [instanceTypes, setInstanceTypes] = useState<InstanceType[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  
  const [form, setForm] = useState<ClusterFormData>({
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

    async function loadData() {
      setIsLoading(true)
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
        
        // Set default provider
        const healthy = providerData.filter((p) => p.status !== "DOWN")
        if (healthy.length > 0) {
          setForm((prev) => ({ ...prev, providerId: healthy[0].id }))
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
  }, [])

  async function handleCreate() {
    if (!form.providerId || !form.region) {
      toast.error("Provider and region are required")
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
      const payload = {
        templateId: form.templateId === "none" ? undefined : form.templateId,
        providerId: form.providerId,
        region: form.region,
        instanceGroups: instancesPayload,
        nodeCount,
      }
      
      await clustersApi.create(experimentId, payload)
      toast.success("Cluster created successfully")
      router.push(`/projects/${projectId}/experiments/${experimentId}`)
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
          onClick={() => router.push(`/projects/${projectId}/experiments/${experimentId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Experiment
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
        onClick={() => router.push(`/projects/${projectId}/experiments/${experimentId}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Experiment
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Cluster</CardTitle>
          <CardDescription>
            Select provider, template, and capacity to provision a new cluster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ClusterFormFields
            form={form}
            onFormChange={setForm}
            providers={providers}
            instanceTypes={instanceTypes}
            templates={templates}
            isCompact={false}
          />

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleCreate}
              disabled={isSaving || !form.providerId || !form.region || form.instanceGroups.every((g) => !g.instanceTypeId)}
              className="min-w-[120px]"
            >
              {isSaving ? "Creating..." : "Create Cluster"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/experiments/${experimentId}`)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
