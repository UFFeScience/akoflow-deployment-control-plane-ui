import type { ProviderCredentialHealthLog } from "@/lib/api/types"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface CredentialHealthLogsProps {
  logs: ProviderCredentialHealthLog[]
}

export function CredentialHealthLogs({ logs }: CredentialHealthLogsProps) {
  if (logs.length === 0) {
    return <p className="text-xs text-muted-foreground">No health check history yet.</p>
  }

  return (
    <ol className="space-y-1">
      {logs.map((log) => (
        <li key={log.id} className="flex items-start gap-2 text-xs">
          {log.health_status === "HEALTHY" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <span className={log.health_status === "HEALTHY" ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
              {log.health_status}
            </span>
            {log.health_message && (
              <span className="text-muted-foreground ml-1 truncate block">{log.health_message}</span>
            )}
            <span className="text-muted-foreground/60">
              {new Date(log.checked_at).toLocaleString()}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
