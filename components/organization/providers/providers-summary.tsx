import { CheckCircle2, Server } from "lucide-react"
import type { Provider } from "@/lib/api/types"

interface ProvidersSummaryProps {
  providers: Provider[]
}

export function ProvidersSummary({ providers }: ProvidersSummaryProps) {
  const totalCredentials = providers.reduce((sum, p) => sum + (p.credentials_count ?? 0), 0)
  const totalHealthy = providers.reduce((sum, p) => sum + (p.healthy_credentials_count ?? 0), 0)

  return (
    <div className="flex items-center gap-6 rounded-lg border bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {providers.length} provider{providers.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-sm">
          <span className="font-medium text-green-600">{totalHealthy}</span>
          <span className="text-muted-foreground">/{totalCredentials} credentials healthy</span>
        </span>
      </div>
    </div>
  )
}
