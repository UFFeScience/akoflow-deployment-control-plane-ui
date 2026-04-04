import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CredentialHealthBadgeProps {
  status?: string | null
}

export function CredentialHealthBadge({ status }: CredentialHealthBadgeProps) {
  if (status === "HEALTHY") {
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50 text-xs">
        <CheckCircle2 className="h-3 w-3" /> Healthy
      </Badge>
    )
  }

  if (status === "UNHEALTHY") {
    return (
      <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50 text-xs">
        <AlertCircle className="h-3 w-3" /> Unhealthy
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 text-gray-500 border-gray-300 text-xs">
      Not checked
    </Badge>
  )
}
