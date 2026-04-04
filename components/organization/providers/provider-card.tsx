import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ProviderTypeIcon } from "./provider-type-icon"
import { ProviderStatusBadge } from "./provider-status-badge"
import { CredentialHealthBar } from "./credential-health-bar"
import type { Provider } from "@/lib/api/types"

interface ProviderCardProps {
  provider: Provider
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const router = useRouter()
  const healthy = provider.healthy_credentials_count ?? 0
  const total = provider.credentials_count ?? 0

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/organization/providers/${provider.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ProviderTypeIcon type={provider.type} />
            <div>
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <CardDescription className="text-xs font-mono">{provider.slug ?? provider.type}</CardDescription>
            </div>
          </div>
          <ProviderStatusBadge healthy={healthy} total={total} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {provider.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{provider.description}</p>
        )}
        <CredentialHealthBar healthy={healthy} total={total} />
      </CardContent>
    </Card>
  )
}
