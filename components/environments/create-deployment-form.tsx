"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Provider, ProviderCredential } from "@/lib/api/types"
import { clustersApi } from "@/lib/api/deployments"
import { providersApi } from "@/lib/api/providers"
import { useAuth } from "@/contexts/auth-context"
import { ClusterFormFields, type ClusterFormData } from "./deployment-form-fields"
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

  const [form, setForm] = useState<ClusterFormData>({
    providerId: "",
    credentialId: "",
  })

  useEffect(() => {
    let active = true

    async function loadData() {
      setIsLoading(true)
      try {
        const providerData = await (currentOrg ? providersApi.list(String(currentOrg.id)) : Promise.resolve([])).catch(() => [])

        if (!active) return

        setProviders(providerData)

        // Set default provider and eagerly load its credentials
        const healthy = providerData.filter((p: Provider) => p.status !== "DOWN")
        const defaultProvider = healthy[0] || providerData[0]
        if (defaultProvider && currentOrg) {
          const defaultProviderId = String(defaultProvider.id)
          setForm((prev) => ({ ...prev, providerId: defaultProviderId }))
          providersApi
            .listCredentials(String(currentOrg.id), defaultProviderId)
            .then((credData: ProviderCredential[]) => { if (active) setCredentials(credData) })
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
    if (!form.providerId || !form.credentialId) {
      toast.error("Provider and credentials are required")
      return
    }

    setIsSaving(true)
    try {
      await clustersApi.create(environmentId, {
        providerId: form.providerId,
        credentialId: form.credentialId,
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
            Select provider and credentials. Region and instance configuration are defined in the Terraform template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ClusterFormFields
            form={form}
            onFormChange={setForm}
            providers={providers}
            credentials={credentials}
            isCompact={false}
          />

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleCreate}
              disabled={isSaving || !form.providerId || !form.credentialId}
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
