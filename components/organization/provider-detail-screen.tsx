"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  ArrowLeft,
  Key,
  PlusCircle,
  Trash2,
  Server,
  Cloud,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { providersApi } from "@/lib/api/providers"
import type { Provider, ProviderCredential } from "@/lib/api/types"
import { toast } from "sonner"
import { ProviderCredentialForm } from "./provider-credential-form"

function ProviderTypeIcon({ type }: { type: string }) {
  if (type === "HPC") return <Cpu className="h-5 w-5 text-violet-500" />
  if (type === "ON_PREM") return <Server className="h-5 w-5 text-orange-500" />
  return <Cloud className="h-5 w-5 text-blue-500" />
}

export function ProviderDetailScreen() {
  const params = useParams()
  const providerId = params.providerId as string
  const router = useRouter()
  const { currentOrg } = useAuth()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [credentials, setCredentials] = useState<ProviderCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCredLoading, setIsCredLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  async function loadProvider() {
    if (!currentOrg) return
    setIsLoading(true)
    try {
      const p = await providersApi.show(String(currentOrg.id), providerId)
      setProvider(p)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load provider")
    } finally {
      setIsLoading(false)
    }
  }

  async function loadCredentials() {
    if (!currentOrg) return
    setIsCredLoading(true)
    try {
      const list = await providersApi.listCredentials(String(currentOrg.id), providerId)
      setCredentials(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load credentials")
    } finally {
      setIsCredLoading(false)
    }
  }

  useEffect(() => {
    loadProvider()
    loadCredentials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId])

  async function handleDeleteCredential(credId: string) {
    if (!currentOrg) return
    try {
      await providersApi.deleteCredential(String(currentOrg.id), providerId, credId)
      setCredentials((prev) => prev.filter((c) => c.id !== credId))
      toast.success("Credential deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete credential")
    }
  }

  function handleCredentialCreated(cred: ProviderCredential) {
    setCredentials((prev) => [cred, ...prev])
    setIsAddOpen(false)
    toast.success("Credential added")
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
        <div className="h-32 rounded-lg bg-muted" />
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Provider not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="mt-0.5" onClick={() => router.push("/organization/providers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Providers</p>
          <div className="flex items-center gap-2">
            <ProviderTypeIcon type={provider.type} />
            <h1 className="text-lg font-semibold">{provider.name}</h1>
            {provider.slug && (
              <Badge variant="secondary" className="font-mono text-xs">
                {provider.slug}
              </Badge>
            )}
          </div>
          {provider.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{provider.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {provider.health_status === "HEALTHY" ? (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50">
              <CheckCircle2 className="h-3 w-3" /> Healthy
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50">
              <AlertCircle className="h-3 w-3" /> {provider.health_status ?? "Unknown"}
            </Badge>
          )}
          <Badge variant="outline">{provider.status}</Badge>
          <Badge variant="outline">{provider.type}</Badge>
        </div>
      </div>

      <Separator />

      {/* Credentials section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Credentials</h2>
            <Badge variant="secondary">{credentials.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadCredentials} disabled={isCredLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isCredLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Add Credential
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Credential</DialogTitle>
                  <DialogDescription>
                    Fill in the required fields for the <strong>{provider.name}</strong> provider.
                  </DialogDescription>
                </DialogHeader>
                <ProviderCredentialForm
                  providerId={providerId}
                  providerSlug={provider.slug}
                  onCreated={handleCredentialCreated}
                  onCancel={() => setIsAddOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isCredLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : credentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <Key className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-medium text-sm">No credentials yet</p>
            <p className="text-xs text-muted-foreground">
              Add a credential to allow this provider to be used in environments.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {credentials.map((cred) => (
              <Card key={cred.id}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{cred.name}</CardTitle>
                      {cred.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{cred.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          cred.is_active
                            ? "text-green-600 border-green-300 bg-green-50"
                            : "text-gray-500 border-gray-300"
                        }
                      >
                        {cred.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete credential?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{cred.name}&quot; and all its stored values. This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteCredential(cred.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {cred.values && cred.values.length > 0 && (
                  <CardContent className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1">
                      {cred.values.map((v) => (
                        <Badge key={v.id} variant="secondary" className="font-mono text-xs">
                          {v.field_key}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
