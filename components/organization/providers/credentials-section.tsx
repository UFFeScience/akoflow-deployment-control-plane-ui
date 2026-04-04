import { Key, PlusCircle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CredentialCard } from "./credential-card"
import { ProviderCredentialForm } from "../provider-credential-form"
import type { ProviderCredential, Provider } from "@/lib/api/types"

interface CredentialsSectionProps {
  providerId: string
  providerName: string
  providerType?: Provider["type"]
  credentials: ProviderCredential[]
  isLoading: boolean
  isAddOpen: boolean
  onAddOpenChange: (open: boolean) => void
  onCredentialCreated: (credential: ProviderCredential) => void
  onDelete: (id: string) => void
  onCheckHealth: (id: string) => Promise<void>
  onRefresh: () => void
}

export function CredentialsSection({
  providerId,
  providerName,
  providerType,
  credentials,
  isLoading,
  isAddOpen,
  onAddOpenChange,
  onCredentialCreated,
  onDelete,
  onCheckHealth,
  onRefresh,
}: CredentialsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Credentials</h2>
          <Badge variant="secondary">{credentials.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={onAddOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Add Credential
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Credential</DialogTitle>
                <DialogDescription>
                  Fill in the required fields for the <strong>{providerName}</strong> provider.
                </DialogDescription>
              </DialogHeader>
              <ProviderCredentialForm
                providerId={providerId}
                providerType={providerType}
                onCreated={onCredentialCreated}
                onCancel={() => onAddOpenChange(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
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
            <CredentialCard
              key={cred.id}
              credential={cred}
              onDelete={onDelete}
              onCheckHealth={onCheckHealth}
            />
          ))}
        </div>
      )}
    </div>
  )
}
