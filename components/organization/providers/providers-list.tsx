import { PlusCircle, RefreshCw, Server } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProviderCard } from "./provider-card"
import { ProvidersSummary } from "./providers-summary"
import { ProviderCreateForm } from "../provider-create-form"
import type { Provider } from "@/lib/api/types"

interface ProvidersListProps {
  providers: Provider[]
  isLoading: boolean
  onRefresh: () => void
  onProviderCreated: (provider: Provider) => void
}

export function ProvidersList({ providers, isLoading, onRefresh, onProviderCreated }: ProvidersListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  function handleCreated(p: Provider) {
    onProviderCreated(p)
    setIsCreateOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
          <h1 className="text-lg font-semibold text-foreground">Providers</h1>
          <p className="text-sm text-muted-foreground">
            Configure cloud and HPC providers used to run environments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
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
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Provider</DialogTitle>
                <DialogDescription>Register a new cloud or HPC provider.</DialogDescription>
              </DialogHeader>
              <ProviderCreateForm onCreated={handleCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!isLoading && providers.length > 0 && <ProvidersSummary providers={providers} />}

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
          <p className="text-sm text-muted-foreground">
            Add your first cloud or HPC provider to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </div>
  )
}
