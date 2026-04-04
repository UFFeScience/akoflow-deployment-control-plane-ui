import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProviderStatusBadgeProps {
  healthy: number
  total: number
}

export function ProviderStatusBadge({ healthy, total }: ProviderStatusBadgeProps) {
  if (total === 0) return null

  if (healthy === total) {
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50 text-xs">
        <CheckCircle2 className="h-3 w-3" /> Healthy
      </Badge>
    )
  }

  if (healthy === 0) {
    return (
      <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50 text-xs">
        <AlertCircle className="h-3 w-3" /> Unhealthy
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300 bg-yellow-50 text-xs">
      <AlertCircle className="h-3 w-3" /> Degraded
    </Badge>
  )
}
