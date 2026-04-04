import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProviderTypeIcon } from "./provider-type-icon"
import type { Provider } from "@/lib/api/types"

interface ProviderDetailHeaderProps {
  provider: Provider
  onBack: () => void
}

export function ProviderDetailHeader({ provider, onBack }: ProviderDetailHeaderProps) {
  const healthy = provider.healthy_credentials_count ?? 0
  const total = provider.credentials_count ?? 0

  return (
    <div className="flex items-start gap-3">
      <Button variant="ghost" size="icon" className="mt-0.5" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Providers</p>
        <div className="flex items-center gap-2 flex-wrap">
          <ProviderTypeIcon type={provider.type} />
          <h1 className="text-lg font-semibold">{provider.name}</h1>
          {provider.slug && (
            <Badge variant="secondary" className="font-mono text-xs">
              {provider.slug}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">{provider.type}</Badge>
        </div>
        {provider.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{provider.description}</p>
        )}
      </div>
      {total > 0 && (
        <div className="text-right text-sm shrink-0">
          <span className={healthy === total ? "text-green-600 font-medium" : healthy === 0 ? "text-red-600 font-medium" : "text-yellow-600 font-medium"}>
            {healthy}/{total}
          </span>
          <span className="text-muted-foreground ml-1">credentials healthy</span>
        </div>
      )}
    </div>
  )
}
