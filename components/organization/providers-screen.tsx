"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Server, Cloud, Cpu, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { providersApi } from "@/lib/api/providers"
import type { Provider } from "@/lib/api/types"
import { toast } from "sonner"
import { ProviderCreateForm } from "./provider-create-form"

function ProviderTypeIcon({ type }: { type: string }) {
  if (type === "HPC") return <Cpu className="h-5 w-5 text-violet-500" />
  if (type === "ON_PREM") return <Server className="h-5 w-5 text-orange-500" />
  return <Cloud className="h-5 w-5 text-blue-500" />
}

function HealthBadge({ status }: { status?: string }) {
  if (status === "HEALTHY")
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50">
        <CheckCircle2 className="h-3 w-3" />
        Healthy
      </Badge>
    )
  return (
    <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50">
      <AlertCircle className="h-3 w-3" />
      {status ?? "Unknown"}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 border-green-300",
    DEGRADED: "bg-yellow-100 text-yellow-700 border-yellow-300",
    DOWN: "bg-red-100 text-red-700 border-red-300",
    MAINTENANCE: "bg-gray-100 text-gray-700 border-gray-300",
  }
  const cls = colorMap[status] ?? "bg-gray-100 text-gray-700 border-gray-300"
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  )
}

export function ProvidersScreen() {
  const router = useRouter()
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  async function load() {
    setIsLoading(true)
    try {
      const list = await providersApi.list()
      setProviders(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load providers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleCreated(p: Provider) {
    setProviders((prev) => [p, ...prev])
    setIsCreateOpen(false)
    toast.success(`Provider "${p.name}" created successfully`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
          <h1 className="text-lg font-semibold text-foreground">Providers</h1>
          <p className="text-sm text-muted-foreground">
            Configure cloud and HPC providers used to run experiments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Provider</DialogTitle>
                <DialogDescription>Register a new cloud or HPC provider.</DialogDescription>
              </DialogHeader>
              <ProviderCreateForm onCreated={handleCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted mt-1" />
              </CardHeader>
              <CardContent>
                <div className="h-3 w-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Server className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">No providers yet</p>
          <p className="text-sm text-muted-foreground">Add your first cloud or HPC provider to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/organization/providers/${p.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ProviderTypeIcon type={p.type} />
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription className="text-xs">{p.slug ?? p.type}</CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <HealthBadge status={p.health_status} />
                  <span className="text-xs text-muted-foreground">
                    {p.credentials_count ?? 0} credential{p.credentials_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
